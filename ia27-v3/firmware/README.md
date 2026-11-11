# Firmware · MicroPython

Aquí se almacenará el código MicroPython para microcontroladores utilizados en el curso de IA.

## Dispositivos compatibles

- Raspberry Pi Pico / Pico W
- ESP32 / ESP32-S3

## Estructura prevista

```
firmware/
├── pico/
│   └── main.py       ← Código para Raspberry Pi Pico
├── esp32/
│   └── main.py       ← Código para ESP32
└── lib/              ← Bibliotecas MicroPython
```

## Instrucciones de carga

1. Instala [Thonny](https://thonny.org/) o usa `ampy`
2. Conecta el microcontrolador por USB
3. Copia los archivos `.py` al dispositivo
