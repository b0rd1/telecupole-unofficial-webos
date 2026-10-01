# telecupole-unofficial-webos

Applicazione Kiosk streaming Zero-UI per Smart TV LG con sistema operativo **webOS** (compatibile con webOS 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 22, 23, 24).

---

## 📁 Struttura del Progetto

```text
telecupole-unofficial-webos/
├── appinfo.json         # Manifest LG webOS (id: telecupole-unofficial-webos, 1080p, Zero-UI)
├── index.html           # Player Kiosk Zero-UI (Hls.js, anti-pause, auto-reconnect, telecomando)
├── config.example.js    # Template per configurare lo stream m3u8 personale
├── config.js            # Il tuo file di configurazione locale (ignorato da .gitignore)
├── icon.png             # Icona applicazione 80x80 px (Drapò piemontese)
├── largeIcon.png        # Icona launcher 130x130 px (Drapò piemontese)
├── splash.png           # Splash screen nero #000000 1920x1080 px (zero sfarfallio)
├── LICENSE              # Licenza MIT e Disclaimer
└── README.md            # Questa guida
```

---

## ⚙️ Configurazione dello Stream Live (Best Practice Git & DMCA)

Per tutelare il repository pubblico da violazioni di copyright o takedown DMCA, l'URL dello streaming non è memorizzato in chiaro nel codice sorgente pubblico.

1. Entra nella cartella `telecupole-unofficial-webos`.
2. Duplica il file `config.example.js` rinominandolo in `config.js`:
   ```bash
   cp config.example.js config.js
   ```
   *(Su Windows: `copy config.example.js config.js`)*
3. Apri `config.js` e incolla l'URL m3u8 del flusso:
   ```javascript
   window.APP_CONFIG = {
     STREAM_URL: "https://tuo-url-streaming/playlist.m3u8"
   };
   ```
4. **Nota**: Il file `config.js` è già inserito nel file `.gitignore`, quindi non verrà mai inviato su GitHub o su repository remoti pubblici.

---

## 🛠️ Requisiti per la Build e Installazione su LG TV

1. **Node.js** (v16, v18, v20 o v22)
2. **CLI ufficiale LG webOS**:
   ```bash
   npm install -g @webos-tools/cli
   ```
   *(oppure la versione legacy `npm install -g ares-cli`)*

---

## 📺 Preparazione della Smart TV LG (Developer Mode)

1. Sulla TV LG, apri **LG Content Store** e cerca l'app **Developer Mode**.
2. Installa e avvia **Developer Mode**.
3. Accedi con il tuo account LG (creane uno gratuito se non lo possiedi).
4. Attiva la voce **Dev Mode Status** impostandola su **ON**.
5. Attiva la voce **Key Server** impostandola su **ON**.
6. Prendi nota di:
   - **IP Address** della TV (es. `192.168.1.150`)
   - **Passphrase** mostrata a schermo (6 caratteri)

---

## 🚀 Comandi Rapidi per il Packaging e l'Installazione (.ipk)

### 1. Registra la TV nella CLI (solo la prima volta):
```bash
ares-setup-device
```
*Seleziona `add`, inserisci un nome (es. `tv`), l'IP della TV, porta `9922` e username `prisoner`.*

### 2. Sincronizza la chiave di sicurezza Developer Mode:
```bash
ares-novacom --device tv --getkey
```
*(Quando richiesto, inserisci la Passphrase a 6 caratteri mostrata sulla TV).*

### 3. Genera il pacchetto `.ipk`:
```bash
ares-package ./telecupole-unofficial-webos
```
Questo comando genererà il file:
`telecupole-unofficial-webos_1.0.0_all.ipk`

### 4. Installa l'applicazione sulla TV:
```bash
ares-install -d tv telecupole-unofficial-webos_1.0.0_all.ipk
```

### 5. Avvia lo streaming su TV:
```bash
ares-launch -d tv telecupole-unofficial-webos
```

---

## ⚖️ Licenza
Distribuito sotto licenza **MIT**. Consulta il file `LICENSE` per i dettagli.

## ⚠️ Disclaimer
Questo progetto è un software open source a scopo personale per poter mostrare i contenuti dell'emittente ai miei genitori.
Non è affiliato, autorizzato, sponsorizzato né associato ufficialmente a Telecupole. 
Tutti i marchi, loghi e flussi multimediali appartengono ai rispettivi proprietari.
