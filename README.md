# Rodoslov porodice Rakićević (Milenko Rakićević)

Interaktivna veb-aplikacija za vizuelizaciju i pretragu porodičnog stabla (rodoslova) Milenka Rakićevića. Aplikacija je optimizovana za brzinu, nudi moderan interaktivni dizajn sa podrškom za mobilne i desktop uređaje, te radi potpuno oflajn bez potrebe za serverskom infrastrukturom.

---

## 🌟 Ključne karakteristike

- **Hibridni responzivni raspored (Layout):**
  - **Desktop (Horizontalni org-chart):** Prikazuje se kao stablo koje raste sleva nadesno sa povezujućim granama i vertikalnim bočnim kontrolama za proširivanje.
  - **Mobilni uređaji (Vertikalna vremenska linija):** Prikazuje se kao pregledna vremenska linija prilagođena uskim ekranima sa horizontalnim kontrolama na dnu kartica.
- **Napredna pretraga:**
  - Omogućava pretragu po imenu, prezimenu, nadimku, supružniku, mestu stanovanja ili godinama rođenja/smrti.
  - Pametno pretraživanje koje prepoznaje i ćirilicu i latinicu, kao i specifične karaktere (č, ć, š, ž, đ).
- **Dvojezičnost (Preslovljavanje):**
  - Mogućnost instant prebacivanja celokupnog interfejsa i podataka između ćirilice i latinice jednim klikom.
- **Rad bez servera (Oflajn režim):**
  - Aplikacija učitava podatke iz lokalnog `data.js` fajla, što omogućava da je pokrenete direktnim otvaranjem `index.html` fajla u bilo kom brauzeru (`file://` protokol), bez podizanja lokalnog servera.
- **Moderna estetika:**
  - Premium izgled sa efektima stakla (glassmorphism), harmonizovanom paletom boja, glatkim mikro-animacijama i jasnim vizuelnim razlikovanjem muških i ženskih linija/kartica.

---

## 📁 Struktura projekta

- `index.html` – Glavna struktura i SEO optimizovan šablon aplikacije.
- `style.css` – Kompletan stilski sistem napisan u čistom CSS-u (responzivnost, povezujuće linije, animacije i teme).
- `app.js` – Logika za dinamičko renderovanje stabla, pretragu, preslovljavanje ćirilice/latinice i interaktivno skupljanje/širenje grana.
- `data.js` – Struktuirana baza podataka rodoslova spakovana u JavaScript objekat kako bi se izbegli CORS problemi pri lokalnom otvaranju.
- `rodoslov.json` – Čist JSON format baze podataka.
- `generate_json.py` – Python skripta korišćena za automatsko parsiranje i struktuiranje podataka iz PDF dokumenta u JSON format.
- `firebase.json` & `.firebaserc` – Pre-konfigurisani fajlovi za brzo hostovanje na Firebase platformi.
- `.gitignore` – Definisana pravila za ignorisanje pomoćnih fajlova (npr. `.venv`, `.firebase`).

---

## 🚀 Kako pokrenuti aplikaciju lokalno

Najjednostavniji način za pokretanje je direktno otvaranje fajla u brauzeru:
1. Preuzmite ili klonirajte repozitorijum.
2. Dvaput kliknite na fajl `index.html`.

Alternativno, ako želite da pokrenete lokalni server (npr. za potrebe testiranja ili razvoja):
```bash
# Pokretanje jednostavnog Python servera u direktorijumu projekta
python3 -m http.server 8000
```
Nakon toga otvorite adresu `http://localhost:8000` u svom brauzeru.

---

## 🌐 Uputstvo za postavljanje na mrežu (Hosting)

Projekat je unapred podešen za besplatno postavljanje na sledeće platforme:

### 1. GitHub Pages (Preporučeno za brzinu i jednostavnost)
GitHub nudi potpuno besplatno hostovanje statičkih sajtova direktno iz repozitorijuma:
1. Idite na podešavanja vašeg repozitorijuma na GitHub-u (**Settings**).
2. U levom meniju izaberite **Pages**.
3. Pod opcijom **Build and deployment**, postavite **Source** na `Deploy from a branch`.
4. Izaberite `main` granu i folder `/ (root)`, a zatim kliknite na **Save**.
5. Kroz nekoliko minuta, vaš sajt će biti dostupan na adresi `https://<korisnicko-ime>.github.io/rodoslov-milenko-rakicevic/`.

### 2. Firebase Hosting
Projekat već sadrži ispravno podešenu konfiguraciju za Firebase Hosting pod imenom projekta `rodoslov-milenko-rakicevic`.

Da biste objavili sajt na Firebase:
1. Instalirajte Firebase CLI alate ukoliko ih već nemate:
   ```bash
   npm install -g firebase-tools
   ```
2. Prijavite se na svoj Firebase nalog:
   ```bash
   firebase login
   ```
3. Objavite aplikaciju:
   ```bash
   firebase deploy
   ```
   Aplikacija će odmah biti aktivna na vašem Firebase poddomenu.
