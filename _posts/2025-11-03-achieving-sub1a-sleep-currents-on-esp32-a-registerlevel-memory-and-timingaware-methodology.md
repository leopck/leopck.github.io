---
author: Fridays with Faraday
category: esp32
description: Technical analysis and implementation guide for ESP32 microcontroller
  programming, DMA optimization, and embedded systems development.
difficulty: intermediate
layout: post
reading_time: 1
show_author: true
show_categories: true
show_date: true
show_reading_time: true
show_related_posts: true
show_share_buttons: true
show_tags: true
tags:
- dma
- microcontroller
- embedded
- performance
- esp32
title: 'Achieving Sub‑1µA Sleep Currents on ESP32: A Register‑Level, Memory‑ and Timing‑Aware
  Methodology'
toc: true
---

# Achieving Sub‑1µA Sleep Currents on ESP32: A Register‑Level, Memory‑ and Timing‑Aware Methodology

## Executive Summary: Why Sub‑1µA Matters and What It Takes on ESP32

Ultra‑low power systems demand a disciplined understanding of silicon behavior, memory placement, and clock/power domains. On the ESP32, sleep current is shaped by Dynamic Frequency Scaling (DFS), auto light‑sleep, deep‑sleep policy, and how GPIO, RTC, and flash are configured. While Espressif’s low‑power guide provides indicative averages—tens of microamps for deep‑sleep with timer/RTC GPIO wake and higher currents for touchpad wake—achieving a true sub‑1 microamp average requires a narrow set of conditions: deep‑sleep with the external crystal and RTC 8 MHz oscillator powered off, flash powered down, GPIOs disabled and rationally biased, and a carefully curated wake‑source regime, all on a board with minimized leakage and parasitic draws.[^5][^4]

This post proceeds in four layers. First, we establish the ground truth by mapping memory and interrupts to IRAM/DRAM/RTC domains and explaining DFS and sleep architecture. Second, we define the register/Kconfig levers that materially affect current—esp_pm_configure, esp_sleep_pd_config, GPIO disablement, and flash power‑down—and we propose a safe wake‑stub flow in RTC FAST memory. Third, we specify measurement methodology—including oscilloscope validation of sleep/wake transitions and current profiling with a shunt and averaging—to evidence sub‑1µA intervals. Finally, we enumerate a bill of materials and hardware modifications—LDO selection, supply isolation, and GPIO biasing—that remove board‑level leakage paths that otherwise dominate current.

Scope and information gaps. Achieving sub‑1µA sleep currents depends on chip stepping, ROM/IDF version, and board design; Espressif’s public TRM does not document all RTC power‑down register bitfields; the digital PMU/clock gating matrix is not fully exposed; and quantitative contributions of internal RC drift or ULP monitor impacts are not comprehensively specified. The methodology and caveats here should be interpreted accordingly and repeated on the target silicon and PCB.[^1][^4][^5]



## System Overview: Memory Map, Interrupt Model, and Sleep Architecture

ESP32’s memory and interrupt architecture fundamentally determines the behavior during sleep and wake. Instruction RAM (IRAM) houses latency‑critical and IRAM‑safe ISR code; DRAM holds data and DMA buffers; RTC FAST memory is available for wake stubs that must execute immediately after deep‑sleep reset; RTC slow memory retains ULP variables across sleep; and the interrupt matrix governs latency, safety, and sharing. Sleep modes gate clocks and power domains, but the residency of code and data across these transitions must be planned.

To illustrate placement implications, Table 1 summarizes ESP32 memory types and constraints.

Table 1: ESP32 memory types and constraints relevant to low‑power design
| Memory | Purpose | Access | DMA | Low‑power retention | Typical placement and constraints |
|---|---|---|---|---|---|
| IRAM (0x40080000–0x400A0000) | Executable code for ISRs and timing‑critical paths | 4‑byte aligned word reads | No | Lost on deep‑sleep reset (code runs from flash after wake); retained while awake | Use IRAM_ATTR and ESP_INTR_FLAG_IRAM for ISR code; constants inside IRAM code must use DRAM_ATTR to avoid flash dependencies[^3] |
| DRAM (0x3FFC0000 region) | Non‑constant data, heap, ISRs’ data | Byte‑addressable | Yes | Lost on deep‑sleep reset | DMA buffers must be in DRAM; use MALLOC_CAP_DRAM/DMA_ATTR; __NOINIT_ATTR for no‑init sections[^3] |
| IROM | Executable code from flash via MMU cache | Cached | No | Lost context on deep‑sleep; used after wake | Default location for app code; cache behavior influences latency[^3] |
| DROM | Read‑only constants from flash via MMU cache | Cached | No | Lost context on deep‑sleep | Use DRAM_ATTR to force constants into DRAM for flash‑unsafe ISRs[^3] |
| RTC FAST memory | Code that must run immediately after deep‑sleep wake | Executable and data | No | Retained through deep‑sleep (code persists); only PRO CPU | Place wake stubs here; not DMA‑capable; slower than IRAM[^3] |
| RTC slow memory | Data for ULP and across deep‑sleep | Data | No | Retained through deep‑sleep | Use RTC_NOINIT_ATTR for variables that must survive sleep[^3] |

IRAM‑safe handlers. Use the ESP‑IDF interrupt allocation APIs to register handlers with ESP_INTR_FLAG_IRAM; all code and data the handler uses must reside in IRAM/DRAM. This avoids cache stalls and flash erase/write conflicts during critical handling. Shared interrupts are level‑triggered; IRAM residency improves determinism and reduces jitter in ISR execution.[^2]

DFS and sleep modes. DFS modulates CPU/APB frequency based on power locks; auto light‑sleep leverages tickless idle to suspend the chip when idle time exceeds a threshold; deep‑sleep powers down most of the chip while retaining RTC/LP memory and selected peripherals. Each has implications for code placement and for current draw. Table 2 maps power domains and clock gating options to sleep modes and their impact.

Table 2: Power domains and clock gating options across sleep modes
| Power domain/clock | Function | Deep‑sleep default | Light‑sleep default | Kconfig/API control | Notes for sub‑µA design |
|---|---|---|---|---|---|
| External 40 MHz XTAL | High‑accuracy clocks (e.g., Wi‑Fi/BT) | Powered down | Typically gated off unless kept | esp_sleep_pd_config(ESP_PD_DOMAIN_XTAL, …) | Turn off to reduce leakage; keep only if needed for accurate wake timing or coexisting radios[^4] |
| Internal 8 MHz RTC OSC | Powers modules like LEDC | Powered down | Gated unless kept | esp_sleep_pd_config(ESP_PD_DOMAIN_RTC8M, …) | Turn off to minimize current unless a module must operate during light sleep[^4] |
| Flash (VCC/PSRAM shared pins) | Code storage | Off (deep‑sleep) | Configurable | CONFIG_ESP_SLEEP_POWER_DOWN_FLASH | Power down in light‑sleep; ensure no PSRAM conflict on shared rails[^4] |
| GPIO banks | Digital I/O | Configurable | Configurable | CONFIG_PM_SLP_DISABLE_GPIO; esp_sleep_disable_gpio_wakeup() | Disabling GPIOs reduces leakage; bias inputs intelligently[^4] |
| RTC FAST/SLOW memory | Wake stubs and ULP data | On | On | RTC_NOINIT_ATTR, RTC_FAST_ATTR | RTC memory retained; plan for stubs/variables accordingly[^3][^5] |


### Memory Placement for Low‑Power Flows

Code that must execute immediately after deep‑sleep reset belongs in RTC FAST memory as wake stubs. RTC slow memory should hold ULP program variables and ULP code images. DMA buffers must not be placed on RTC memories; allocate DMA buffers in DRAM with appropriate attributes. IRAM‑safe ISRs reduce latency spikes during flash operations and are essential for any timing‑critical handler that must not miss deadlines under DFS or light‑sleep transitions.[^3][^2]



## Register‑Level Deep‑Sleep Control: APIs, Kconfig, and Wake‑Stub Design

At the register and API layer, the levers that matter most for ultra‑low power are:

- esp_pm_configure to enable DFS and optionally auto light‑sleep, choosing min/max CPU frequencies to shape idle current.
- esp_sleep_pd_config to explicitly power down the external XTAL and internal 8 MHz RTC oscillator in deep‑sleep, and to keep them on only when strictly necessary.
- Kconfig flags that disable GPIOs during sleep and power down flash during light‑sleep, with PSRAM caveats.
- Wake‑stub code placed in RTC FAST memory to execute the earliest post‑wake logic, before the bootloader, to minimize dynamic current during resume.

To make the trade‑offs visible, Table 3 summarizes recommended configurations and indicative implications.

Table 3: Recommended DFS/Light‑sleep settings for low‑power apps and expected current impact
| Configuration area | Recommended setting | Current impact | Notes |
|---|---|---|---|
| DFS | CONFIG_PM_ENABLE; max_freq_mhz=160; min_freq_mhz=40 | Reduces idle current by lowering CPU/APB frequency | Shape current during active/idle; suitable when CPU must remain active[^4] |
| Auto light‑sleep | esp_pm_config_t.light_sleep_enable=true; tickless idle; idle time before sleep tuned | Significant drop during sleep; wake latency exists | Not suitable for hard real‑time external response[^4] |
| GPIO disable in sleep | CONFIG_PM_SLP_DISABLE_GPIO=ON | Lowers leakage through inputs | Combine with proper biasing to avoid floating inputs[^4] |
| Flash power‑down in light sleep | CONFIG_ESP_SLEEP_POWER_DOWN_FLASH=ON | Removes flash current | Requires careful PSRAM sharing analysis[^4] |
| RTC clock source | CONFIG_RTC_CLK_SRC to internal RC where acceptable | Slightly reduces power vs crystal | Trade accuracy for power; internal RC has larger offset[^4] |

Power domain control is explicit: call esp_sleep_pd_config for ESP_PD_DOMAIN_XTAL and ESP_PD_DOMAIN_RTC8M with ESP_PD_OPTION_OFF in deep‑sleep unless a feature absolutely requires them. Table 4 lists domain choices and sub‑1µA implications.

Table 4: Power domain policy matrix for deep‑sleep
| Domain | Keep ON? | Rationale | Implication for sub‑1µA |
|---|---|---|---|
| XTAL (40 MHz) | Only if precise timing or radio coexistence required | Accuracy/stability for modules like BT | Leave OFF to eliminate a leakage path[^4] |
| RTC8M (8 MHz) | Only if modules (e.g., LEDC) must function during light‑sleep | Module functionality during sleep | Leave OFF in deep‑sleep to minimize current[^4] |
| Flash | OFF | Code not executing in deep‑sleep | Power down to reduce leakage[^4] |
| RTC memory | ON | Required for wake stubs/ULP | Intentionally retained; does not prevent sub‑1µA if other domains are off[^3][^5] |


### Wake‑Stub and ULP Co‑processor Patterns

Design the earliest post‑wake flow to run from RTC FAST memory (wake stub) and keep ULP program and data in RTC slow memory. The ULP can sample RTC GPIO, the on‑chip temperature sensor, or SAR ADC, store results in RTC slow memory, and act as a wake source based on thresholds. Use helper APIs where appropriate to initialize monitors, but keep the ULP program minimal and infrequent to avoid recurring current spikes.[^5][^3]



## Measuring Sub‑1µA Sleep: Instrumentation and Oscilloscope Validation

Sub‑1µA current is a system property, not a single register setting. It must be measured with instrumentation that resolves microamp currents and short transients. A shunt‑based measurement with a low‑noise op‑amp and a high‑resolution digitizer is recommended; the shunt should be chosen to keep the voltage headroom within the ESP32’s operating range while enabling sufficient resolution at microamp levels. Synchronize current measurements with oscilloscope observations of sleep/wake transitions, using GPIO toggles to mark enter/exit events.

Table 5 outlines the measurement setup.

Table 5: Measurement setup overview
| Instrument | Probe points | Trigger strategy | Sampling |
|---|---|---|---|
| High‑resolution DMM or digitizing amp + scope | Shunt in series with ESP32 VCC; ground reference near device | Trigger on GPIO toggle marking sleep entry/exit; capture wake‑stub execution edge | Sample current at high rate for integration; use bandwidth limiting to reduce noise |
| Logic analyzer (optional) | GPIO debug pins for enter/exit/wake‑stub activity | Align logic edges with current trace | Validate timing of power domain toggles |
| Temperature/environment log | Board ambient | Note environmental variations | Correlate drift and leakage changes |

To validate policy choices, capture traces for configurations with XTAL/RTC8M on vs off, with GPIO disable on vs off, and flash power‑down on vs off. Use esp_timer_get_time stamps around sleep APIs and GPIO toggles to correlate software events with current behavior. The IDF performance guide recommends microsecond‑level timestamps for timing validation; apply them judiciously given their overhead.[^8] The Espressif IoT Solution guidance on deep‑sleep current averages provides a baseline for expected levels under different wake sources; replicate measurements with identical wake sources to compare results.[^5]

#### Measurement pitfalls and remediation

- Shunt_resistance and burden_voltage: Select a shunt that yields tens of microvolts per microamp; ensure the ESP32’s minimum operating voltage is respected under load. Compensate for burden voltage in post‑processing.
- Board leakage: Clean flux residues, remove debug LEDs, isolate hopes of PSRAM/flash power domains, and ensure RTC GPIOs are not floating. Real boards often have microamps of parasitic leakage that swamp silicon current.
- Temperature dependence: Characterize current across operating temperature; leakage increases with temperature.
- Ringing and artifacts: Decouple supplies close to the ESP32; use short ground leads; apply bandwidth limiting during integration to avoid noise spikes that skew average current.



## Memory Dump and ISR Analysis: Correlating Low‑Power State with Runtime Data

Use JTAG with OpenOCD/GDB to halt the system in low‑power states and dump relevant memory regions—RTC slow memory contents (RTC_NOINIT_ATTR), IRAM/DRAM for ISR code/data (IRAM_ATTR and DRAM_ATTR), and any noinit sections. The esp_intr_dump API lists allocated and free interrupts with priority and status; use it to confirm the absence of stray shared handlers that could keep the system awake or induce jitter.[^2][^6][^7]

Assembly patterns for wake‑stub code should minimize data access to RTC memory only, avoid external RAM and flash, and refrain from invoking heap APIs or complex C++ constructs. Align critical paths with IRAM residency rules: any handler registered with ESP_INTR_FLAG_IRAM and the code it calls must be placed in IRAM; read‑only data it references should be in DRAM (via DRAM_ATTR), not flash.[^2][^3] A post‑mortem core dump analysis on fatal errors can reveal stack corruptions or unexpected ISR activity that coincide with higher sleep current or intermittent wake‑latency spikes.[^20]



## Hardware Modifications and Board‑Level Adjustments for Sub‑1µA

Board‑level leakage often dominates silicon current. Consider the following:

- Supply design: Select a low‑leakage LDO with low quiescent current at light loads; minimize external bias networks on RTC GPIOs; ensure PSRAM/flash power domains do not couple leakage back into ESP32 rails. Follow Espressif’s hardware design guidelines for decoupling and layout recommendations, and be mindful of SDIO‑LDO configurations noted in datasheets.[^16][^17]
- GPIO biasing: Turn off INPUT_PULLUP/PULLDOWN on all GPIOs during sleep (CONFIG_PM_SLP_DISABLEGPIO). Float inputs only with deliberate bias to avoid threshold‑region leakage; route RTC GPIO wake sources cleanly.
- Crystal and oscillator: If accurate timing during sleep is not required, keep the external crystal and RTC 8 MHz oscillator powered down via esp_sleep_pd_config; this removes a noticeable leakage contribution compared with leaving them on.[^4]
- Crystal load capacitors: Re‑evaluate values if the crystal is kept powered in light‑sleep for timing accuracy; otherwise, removing or minimizing unnecessary loads reduces dynamic and leakage losses.
- SDIO/flash pins: Ensure these are not undriven during sleep; weak pulls can create leakage paths. Review strap pin behavior and kit schematics for deviations.



## Achieving Sub‑1µA: Practical Checklists, Caveats, and Expected Results

The following checklist distills the register/Kconfig/actions needed to maximize deep‑sleep residency at the lowest current.

Table 6: Sub‑1µA deep‑sleep checklist
| Item | Action | Verification |
|---|---|---|
| DFS configured | esp_pm_configure with max/min freq set; optionally enable auto light‑sleep only if acceptable | Current falls during idle; tickless behavior observed[^4] |
| Power domains off | esp_sleep_pd_config(ESP_PD_DOMAIN_XTAL, OFF); esp_sleep_pd_config(ESP_PD_DOMAIN_RTC8M, OFF) | No XTAL/RTC8M activity; current drop in deep‑sleep[^4] |
| Flash power‑down | CONFIG_ESP_SLEEP_POWER_DOWN_FLASH=ON (ensure PSRAM not on shared pins) | Current drop without access latency on wake[^4] |
| GPIO disable | CONFIG_PM_SLP_DISABLEGPIO=ON; esp_sleep_disable_gpio_wakeup() | Reduced input leakage; trace shows lower baseline[^4] |
| RTC memory retention | Use RTC_NOINIT_ATTR for variables; keep wake stub in RTC FAST | Stub executes post‑wake; variables retained[^3] |
| Board leakage | Remove debug LEDs, clean flux, isolate rails; measure with shunt | Parasitic current minimized |
| ULP scheduling | ULP runs infrequently; monitors set with thresholds | Current spikes rare and brief[^5] |
| Calibration/accuracy | If internal RC used, accept offset; avoid XTAL if not needed | Timer accuracy acceptable for app[^4] |

Caveats that prevent reaching sub‑1µA include leaving XTAL/RTC8M on for convenience, enabling auto light‑sleep when periodic wake sources cause频繁 wake‑stub activity, keeping flash powered during light‑sleep, floating inputs that leak, and board‑level leakage from sloppy layout or instrumentation. With disciplined configuration and clean hardware, deep‑sleep current can approach the low microamp regime described by Espressif’s low‑power guide; however, true sub‑1µA averages require additional conditions—particularly complete power‑down of clocks and external storage, and careful avoidance of board leakage.[^5][^4]



## Appendix: Assembly Snippets and Memory Maps for Wake Flows and ISR Safety

Below are minimal assembly considerations for wake‑stub flows and ISR safety; the focus is on residency and minimal data access rather than instruction encoding.

- Wake‑stub in RTC FAST: The stub should execute immediately after deep‑sleep reset, before the bootloader. Its responsibilities are minimal: clear reset cause flags, configure the earliest needed clocks (if any), and branch to the bootloader entry. Keep data access to RTC slow memory only, avoid DMA and external RAM, and do not use heap or complex libc functions. Mark the stub code with appropriate RTC FAST attributes according to IDF/RTOS build placement rules.[^3]
- IRAM‑safe ISRs: Any ISR registered with ESP_INTR_FLAG_IRAM must have its code in IRAM and any read‑only data it references in DRAM (via DRAM_ATTR). Do not reference flash or external RAM from IRAM handlers; if constants are needed, place them in DRAM using DRAM_ATTR within the IRAM function.[^2][^3]
- Disassembly and symbol review: Use nm on the ELF to list symbols in RTC FAST and IRAM sections, confirm .iram.text and .rtc.text regions, and ensure no unexpected references to cached flash or external RAM occur in wake‑stub code.[^6]
- Minimal LED toggle by register (W1TS/W1TC): When debugging wake transitions, it can be useful to drive a GPIO using atomic set/clear registers. For example, on many ESP32 boards, the following patterns toggle an LED on GPIO2 using write‑1‑to‑set and write‑1‑to‑clear semantics; adapt for your board’s LED GPIO and verify on the TRM. A minimal example (C) for an IRAM‑safe toggle path might look like:

```
volatile uint32_t * const GPIO_OUT_W1TS = (volatile uint32_t *)0x3FF44008; // set bits
volatile uint32_t * const GPIO_OUT_W1TC = (volatile uint32_t *)0x3FF4400C; // clear bits
volatile uint32_t * const GPIO_ENABLE_W1TS = (volatile uint32_t *)0x3FF44024; // enable output bits

void LED_ON(void) { *GPIO_ENABLE_W1TS = (1u << 2); *GPIO_OUT_W1TS = (1u << 2); }
void LED_OFF(void) { *GPIO_OUT_W1TC = (1u << 2); }
```

Use IRAM_ATTR for the functions if they must be latency‑safe, and mark any constant strings used in debug paths with DRAM_ATTR to keep them out of flash. This approach leverages atomic bit operations and avoids function call overhead; see bare‑metal references for register semantics and boot/startup considerations.[^6][^7]



## References

[^1]: Espressif Systems. ESP32 Technical Reference Manual. https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf  
[^2]: ESP‑IDF Programming Guide (v5.5.1). Interrupt Allocation — ESP32. https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/intr_alloc.html  
[^3]: ESP‑IDF Programming Guide (v5.5.1). Memory Types — ESP32. https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/memory-types.html  
[^4]: ESP‑IDF Programming Guide (v5.5.1). Low‑Power Mode (SoC) — ESP32. https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/low-power-mode/low-power-mode-soc.html  
[^5]: ESP‑IoT‑Solution (latest). ESP32 Low‑Power Management. https://docs.espressif.com/projects/esp-iot-solution/en/latest/low_power_solution/esp32_lowpower_solution.html  
[^6]: Getting Started with Bare Metal ESP32 Programming. https://vivonomicon.com/2019/03/30/getting-started-with-bare-metal-esp32-programming/  
[^7]: Baremetal ESP32 Programming: Direct Register Access for LED Control. https://ibrahimmansur4.medium.com/baremetal-esp32-programming-direct-register-access-for-led-control-d4d5b6de28cd  
[^8]: ESP‑IDF Programming Guide (v5.5.1). Maximizing Execution Speed — ESP32. https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/performance/speed.html  
[^16]: Espressif Systems. ESP32 Hardware Design Guidelines. https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/esp-hardware-design-guidelines-en-master-esp32.pdf  
[^17]: ESP32 Series Datasheet. https://files.seeedstudio.com/wiki/Spartan-Edge-Accelerator-Board/res/ESP32-datasheet.pdf  
[^20]: ESP‑IDF Programming Guide (v5.5.1). Core Dump — ESP32. https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/core_dump.html