# Wdrożenie Wika Chat na Cloudflare Workers

Ta wersja nie jest już wyłącznie statyczną stroną. Zawiera endpoint AI, dlatego zwykłe przesłanie ZIP-a do pola przeznaczonego tylko dla statycznych plików nie uruchomi prawdziwego czatu.

## Najprościej przez komputer

1. Rozpakuj ZIP.
2. Zainstaluj Node.js.
3. Otwórz terminal w folderze projektu.
4. Uruchom:

```bash
npm install
npx wrangler login
npm run deploy
```

Nazwa Workera w `wrangler.jsonc` to `wikaofficial`, więc wdrożenie aktualizuje Worker o tej nazwie na zalogowanym koncie.

## Przez GitHub i Cloudflare

1. Prześlij cały projekt do repozytorium GitHub.
2. W Cloudflare otwórz `Workers & Pages`.
3. Wybierz import projektu z Git.
4. Połącz repozytorium.
5. Polecenie wdrożenia ustaw na:

```bash
npx wrangler deploy
```

Cloudflare odczyta katalog `public`, skrypt `src/index.js` oraz binding Workers AI z `wrangler.jsonc`.

## Workers AI

Binding jest już skonfigurowany:

```json
"ai": {
  "binding": "AI"
}
```

Nie jest potrzebny klucz API ani Client Secret.

## Zmiana charakteru bota

Edytuj stałą `SYSTEM_PROMPT` w pliku `src/index.js`.

## Podgląd lokalny

```bash
npm install
npm run dev
```

Przy zwykłym otwarciu pliku `public/index.html` czat pokazuje krótkie odpowiedzi demonstracyjne. Prawdziwe Workers AI działa po wdrożeniu Workera.
