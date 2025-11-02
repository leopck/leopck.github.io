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
title: Minimal Bare Metal Bootloader
toc: true
---

# Minimal Bare Metal Bootloader

**ARM Cortex-M4** • **Bootloader** • **Assembly**

Writing a minimal bootloader from scratch without vendor HAL libraries. Just startup assembly, a linker script, and some C code. The goal was to understand what actually happens before main() runs.

## Results

| Metric | Value |
|--------|-------|
| Binary Size | **2KB** |
| Boot Time | **50ms** |
| Flash Reserved | **8KB** |
| Success Rate | **100%** |

## Why Write a Bootloader?

I wanted to implement field firmware updates over UART without an external programmer. Commercial bootloaders exist, but building one yourself teaches you exactly what happens during MCU startup, how the vector table works, and how to manage multiple firmware images in flash.

Target: STM32F407VG, 1MB flash, 192KB RAM. The bootloader occupies the first 8KB, application starts at 0x08002000.

## Memory Layout

The flash is divided into bootloader and application sections:

```
0x08000000 - 0x08001FFF (8KB)  : Bootloader
0x08002000 - 0x080FFFFF (1016KB): Application
0x20000000 - 0x2002FFFF (192KB) : RAM
```

## The Linker Script

First, define the memory regions and sections. This tells the compiler where everything goes.

```c
/* bootloader.ld */
MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 8K
    RAM (rwx)   : ORIGIN = 0x20000000, LENGTH = 192K
}

_estack = ORIGIN(RAM) + LENGTH(RAM);  /* Top of stack */

SECTIONS
{
    /* Vector table must be at the start of flash */
    .isr_vector :
    {
        . = ALIGN(4);
        KEEP(*(.isr_vector))
        . = ALIGN(4);
    } >FLASH

    /* Code section */
    .text :
    {
        . = ALIGN(4);
        *(.text)
        *(.text*)
        *(.rodata)
        *(.rodata*)
        . = ALIGN(4);
    } >FLASH

    /* Initialized data (copied from flash to RAM at startup) */
    .data :
    {
        . = ALIGN(4);
        _sdata = .;
        *(.data)
        *(.data*)
        . = ALIGN(4);
        _edata = .;
    } >RAM AT>FLASH

    /* Uninitialized data (zeroed at startup) */
    .bss :
    {
        . = ALIGN(4);
        _sbss = .;
        *(.bss)
        *(.bss*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
    } >RAM
}
```

## Startup Code

The startup assembly initializes the stack, copies .data from flash to RAM, zeros .bss, and jumps to main().

```assembly
/* startup.s - ARM Cortex-M4 startup */
.syntax unified
.cpu cortex-m4
.thumb

/* Vector table */
.section .isr_vector,"a"
.word _estack              /* Initial stack pointer */
.word Reset_Handler        /* Reset handler */
.word NMI_Handler
.word HardFault_Handler
/* ... more exception vectors ... */

/* Reset handler - executed on startup */
.section .text.Reset_Handler
.weak Reset_Handler
.type Reset_Handler, %function
Reset_Handler:
    /* Copy .data from flash to RAM */
    ldr r0, =_sdata        /* Start of .data in RAM */
    ldr r1, =_edata        /* End of .data in RAM */
    ldr r2, =_sidata       /* Start of .data in flash */
    movs r3, #0
    b copy_data_check

copy_data_loop:
    ldr r4, [r2, r3]       /* Read from flash */
    str r4, [r0, r3]       /* Write to RAM */
    adds r3, r3, #4

copy_data_check:
    adds r4, r0, r3
    cmp r4, r1
    bcc copy_data_loop

    /* Zero .bss section */
    ldr r2, =_sbss
    ldr r4, =_ebss
    movs r3, #0
    b zero_bss_check

zero_bss_loop:
    str r3, [r2]
    adds r2, r2, #4

zero_bss_check:
    cmp r2, r4
    bcc zero_bss_loop

    /* Call main() */
    bl main
    bx lr

/* Default exception handlers */
.weak NMI_Handler
.thumb_set NMI_Handler,Default_Handler

.weak HardFault_Handler
.thumb_set HardFault_Handler,Default_Handler

Default_Handler:
    b Default_Handler
```

## Bootloader Logic

The main bootloader code checks for a valid application and jumps to it, or enters update mode if requested.

```c
#include <stdint.h>

#define APP_START_ADDR    0x08002000
#define BOOT_FLAG_ADDR    0x2001FFF0  /* Magic value in RAM */
#define BOOT_FLAG_UPDATE  0xDEADBEEF

typedef void (*app_fn)(void);

static int is_app_valid(uint32_t app_addr) {
    /* Check if stack pointer is in RAM */
    uint32_t sp = *((__IO uint32_t*)app_addr);
    if (sp < 0x20000000 || sp > 0x20030000) {
        return 0;
    }
    
    /* Check if reset vector points to flash */
    uint32_t reset = *((__IO uint32_t*)(app_addr + 4));
    if (reset < 0x08000000 || reset > 0x08100000) {
        return 0;
    }
    
    return 1;
}

static void jump_to_app(uint32_t app_addr) {
    /* Get application stack pointer and reset handler */
    uint32_t app_sp = *((__IO uint32_t*)app_addr);
    uint32_t app_reset = *((__IO uint32_t*)(app_addr + 4));
    
    /* Disable all interrupts */
    __disable_irq();
    
    /* Relocate vector table to application */
    SCB->VTOR = app_addr;
    
    /* Set stack pointer */
    __set_MSP(app_sp);
    
    /* Jump to application reset handler */
    app_fn app = (app_fn)app_reset;
    app();
    
    /* Should never reach here */
    while(1);
}

int main(void) {
    /* Check if firmware update requested */
    volatile uint32_t* boot_flag = (uint32_t*)BOOT_FLAG_ADDR;
    
    if (*boot_flag == BOOT_FLAG_UPDATE) {
        *boot_flag = 0;  /* Clear flag */
        
        /* Enter firmware update mode */
        uart_init();
        firmware_update_mode();
    }
    
    /* Try to boot application */
    if (is_app_valid(APP_START_ADDR)) {
        jump_to_app(APP_START_ADDR);
    }
    
    /* No valid app - enter recovery mode */
    uart_init();
    recovery_mode();
    
    while(1);
}
```

## Firmware Update Protocol

Simple UART protocol for receiving new firmware over serial:

```c
void firmware_update_mode(void) {
    uart_puts("Bootloader v1.0\r\n");
    uart_puts("Ready for firmware update\r\n");
    
    uint32_t addr = APP_START_ADDR;
    uint32_t bytes_received = 0;
    
    /* Erase application flash */
    flash_erase(APP_START_ADDR, 1016 * 1024);
    
    while(1) {
        /* Simple protocol: [CMD][LEN][DATA][CRC] */
        uint8_t cmd = uart_getc();
        
        if (cmd == 0x01) {  /* Write data */
            uint16_t len = uart_get_u16();
            uint8_t data[256];
            
            for (int i = 0; i < len; i++) {
                data[i] = uart_getc();
            }
            
            uint16_t crc = uart_get_u16();
            if (crc == calc_crc16(data, len)) {
                flash_write(addr, data, len);
                addr += len;
                bytes_received += len;
                uart_putc(0x06);  /* ACK */
            } else {
                uart_putc(0x15);  /* NAK */
            }
        }
        else if (cmd == 0x02) {  /* Finish */
            if (is_app_valid(APP_START_ADDR)) {
                uart_puts("Update complete\r\n");
                jump_to_app(APP_START_ADDR);
            } else {
                uart_puts("Invalid firmware\r\n");
            }
        }
    }
}
```

## Building and Flashing

Compile with ARM GCC and flash using st-link:

```bash
$ arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -c startup.s
$ arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -c main.c uart.c flash.c
$ arm-none-eabi-gcc -T bootloader.ld *.o -o bootloader.elf -nostdlib
$ arm-none-eabi-objcopy -O binary bootloader.elf bootloader.bin

$ ls -lh bootloader.bin
-rw-r--r-- 1 user user 2.1K Jan 15 10:23 bootloader.bin

$ st-flash write bootloader.bin 0x8000000
st-flash 1.7.0
2024-01-15T10:23:45 INFO common.c: Loading device parameters....
2024-01-15T10:23:45 INFO common.c: Device connected is: F4 device, id 0x10076413
2024-01-15T10:23:46 INFO common.c: Flash written and verified!
```

## Testing the Bootloader

Power cycle and observe boot sequence:

```
$ minicom -D /dev/ttyUSB0 -b 115200
[Power cycle]

Bootloader v1.0
Checking application at 0x08002000...
Valid application found
Jumping to application in 50ms...

Application v2.3
System initialized
```

## What I Learned

• The vector table MUST be the first thing in flash - CPU reads initial SP and reset handler from 0x0.  
• Linker scripts are powerful but cryptic - understanding them is essential for embedded work.  
• Always validate the application before jumping - check SP and reset vector point to valid memory.  
• The VTOR (Vector Table Offset Register) needs to be updated when relocating to the app.  
• Stack pointer must be set manually before jumping to application.  
• A simple CRC check prevents bricking the device with corrupted firmware.  
• Testing on real hardware revealed timing issues not visible in simulation.
