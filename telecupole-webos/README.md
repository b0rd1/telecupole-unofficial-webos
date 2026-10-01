# Telecupole - LG Smart TV webOS Application

Applicazione Kiosk streaming Zero-UI nativa per Smart TV LG con sistema operativo **webOS** (compatibile con webOS 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 22, 23, 24).

---

## 📁 Struttura della Cartella

```text
telecupole-webos/
├── appinfo.json         # Manifest certificato LG webOS (id: com.unofficial.telecupole, 1080p, Zero-UI)
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

1. Entra nella cartella `telecupole-webos`.
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
4. **Tranquillo**: Il file `config.js` è già inserito nel file `.gitignore`, quindi non verrà mai inviato su GitHub o su repository remoti!

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
5. Prendi nota di:
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
Posizionati nella cartella superiore ed esegui:
```bash
ares-package ./telecupole-webos
```
Questo comando genererà il file:
`it.telecupole.tv_1.0.0_all.ipk`

### 4. Installa l'applicazione sulla TV:
```bash
ares-install -d tv it.telecupole.tv_1.0.0_all.ipk
```

### 5. Avvia lo streaming su TV:
```bash
ares-launch -d tv it.telecupole.tv
```

### 6. Debug e ispezione da remoto (Chrome DevTools):
```bash
ares-inspect -d tv it.telecupole.tv
```

---

## 🛡️ Caratteristiche Tecniche Implementate

- **Zero-UI Kiosk**: Cursore del Magic Remote completamente nascosto (`cursor: none`), nessuno sfarfallio (schermo nero puro `#000000`), assenza di qualsiasi barra o popup.
- **Blocco Totale della Pausa**: Qualsiasi evento di pausa o click/tasto viene intercettato e forza immediatamente il ripristino di `video.play()`.
- **Ripristino Automatico Continuo**: Watchdog timer che rileva freeze del buffer o disconnessioni di rete, con recupero graduale senza mai mostrare crash o schermate bianche.
- **Gestione Telecomando webOS**:
  - Tasto **Back / Return** (Key Code 461): chiude l'app via `webOS.platformBack()` o `window.close()`.
  - Tasti **Play (415), Pause (19), Stop (413)**: consumati e reindirizzati a riproduzione forzata.

---

## ⚖️ Licenza
Distribuito sotto licenza **MIT**. Consulta il file `LICENSE` per i dettagli.

## ⚠️ Disclaimer
Questo progetto è un software open source a scopo personale per poter mostrare i contenuti dell'emittente ai miei genitori.
Non è affiliato, autorizzato, sponsorizzato né associato ufficialmente a Telecupole. 
Tutti i marchi, loghi e flussi multimediali appartengono ai rispettivi proprietari.

