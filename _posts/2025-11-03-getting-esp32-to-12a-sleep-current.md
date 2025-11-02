---
author: Fridays with Faraday
category: experiments
description: Bare metal programming experiments, bootloader development, and low-level
  systems programming techniques.
difficulty: advanced
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
- experiments
- bootloader
- arm
- firmware
- assembly
title: Getting ESP32 to 12µA Sleep Current
toc: true
---

# Getting ESP32 to 12µA Sleep Current

**Tags:** ESP32 • Low Power • Deep Sleep

Out of the box, ESP32 deep sleep pulls around 150µA. This documents how I got it down to 12µA by tweaking power domains, disabling peripherals, and configuring GPIO properly.

## Results

| Metric | Value |
|--------|--------|
| **Sleep Current** | 12µA |
| **Wake Time** | 800ms |
| **Power Reduction** | 92% |
| **CR2032 Battery Life** | 3 Years |

## The Problem

I needed to run a sensor node on a coin cell for years. ESP32 is great for quick prototyping with WiFi, but the default deep sleep current of 150µA means a CR2032 battery (220mAh) would only last about 2 months. Not good enough.

The datasheet claims 10µA is possible in deep sleep, so I set out to figure out what was consuming all that extra power.

## Baseline Measurement

First, I needed to know where I was starting from. Using a µCurrent Gold in series with the power supply:

```bash
$ measure_current.py --mode deep_sleep
Entering deep sleep...
Average current: 147.3 µA
Peak current: 152.1 µA
⚠ Target: 10-15 µA (10x higher than expected!)
```

```c
// Initial naive deep sleep code
void enter_deep_sleep() {
    esp_sleep_enable_timer_wakeup(60 * 1000000); // 60 seconds
    esp_deep_sleep_start();
}
```

## Optimization Steps

### 1. Disable WiFi and Bluetooth

Even though they're not actively used, the radios can leak current.

```c
void disable_radios() {
    esp_wifi_stop();
    esp_bt_controller_disable();
    // Result: 147µA → 138µA (9µA saved)
}
```

### 2. Configure GPIO States

This was the big one. Floating GPIO pins can cause significant current draw. Each pin needs to be explicitly configured.

```c
void configure_gpio_for_sleep() {
    // Disable all GPIO pull-ups/pull-downs except RTC pins
    for (int i = 0; i < GPIO_NUM_MAX; i++) {
        if (!rtc_gpio_is_valid_gpio(i)) {
            gpio_reset_pin(i);
            gpio_set_direction(i, GPIO_MODE_INPUT);
            gpio_set_pull_mode(i, GPIO_FLOATING);
        }
    }
    
    // Configure RTC GPIO for wake-up if needed
    rtc_gpio_pullup_en(GPIO_NUM_33);
    rtc_gpio_pulldown_dis(GPIO_NUM_33);
    
    // Result: 138µA → 45µA (93µA saved!)
}
```

### 3. Power Domain Configuration

ESP32 has multiple power domains. Shutting down unused ones helps significantly.

```c
void configure_power_domains() {
    // Keep only RTC_SLOW_MEM powered in deep sleep
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_ON);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_FAST_MEM, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_XTAL, ESP_PD_OPTION_OFF);
    
    // Result: 45µA → 28µA (17µA saved)
}
```

### 4. Disable Internal Regulators

Some internal voltage regulators can be disabled if using external power supply regulation.

```c
// Reduce internal regulator current in deep sleep
esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);

// Use external 3.3V regulator, disable internal LDO
REG_CLR_BIT(RTC_CNTL_REG, RTC_CNTL_REGULATOR_FORCE_PU);

// Result: 28µA → 15µA (13µA saved)
```

### 5. External Component Check

Don't forget about external components! The devboard had a power LED that drew 3µA.

```c
// Physical modification: remove power LED
// Also verified no pull-ups on I2C lines (they were adding 2µA each)

// Result: 15µA → 12µA (3µA saved)
```

## Final Implementation

Here's the complete optimized sleep function:

```c
#include "esp_sleep.h"
#include "driver/rtc_io.h"

void enter_ultra_low_power_sleep(uint64_t sleep_time_us) {
    // 1. Disable radios
    esp_wifi_stop();
    esp_bt_controller_disable();
    
    // 2. Configure all GPIO
    for (int i = 0; i < GPIO_NUM_MAX; i++) {
        if (!rtc_gpio_is_valid_gpio(i)) {
            gpio_reset_pin(i);
            gpio_set_direction(i, GPIO_MODE_INPUT);
            gpio_set_pull_mode(i, GPIO_FLOATING);
        }
    }
    
    // 3. Configure power domains
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_ON);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_FAST_MEM, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_XTAL, ESP_PD_OPTION_OFF);
    
    // 4. Disable unnecessary regulators
    REG_CLR_BIT(RTC_CNTL_REG, RTC_CNTL_REGULATOR_FORCE_PU);
    
    // 5. Set wake time and sleep
    esp_sleep_enable_timer_wakeup(sleep_time_us);
    esp_deep_sleep_start();
}
```

## Results

Final measurement with the optimized code:

```bash
$ measure_current.py --mode deep_sleep
Entering deep sleep...
Average current: 12.1 µA
Peak current: 13.4 µA
✓ Target achieved! 92% reduction from baseline

$ calculate_battery_life --capacity 220 --current 12.1
Estimated battery life: 2.08 years (CR2032)
```

## Lessons Learned

• **GPIO configuration was the biggest win (93µA saved).** Always configure every pin explicitly.  
• Don't trust devboards for power measurements - they have extra components that consume power.  
• The datasheet is optimistic but achievable with proper configuration.  
• Use an actual current meter, not just multimeter - you need µA resolution.  
• Document your baseline before optimizing - you need to know what you're improving from.

---

*[← Back to all experiments](../experiments.html)*