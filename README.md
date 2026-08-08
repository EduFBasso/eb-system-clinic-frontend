# Frontend Clinic

Frontend do sistema Clinic, separado do domínio Bakery.

## Stack

- React + Vite + TypeScript
- Testes com Vitest

## Deploy

- Projeto dedicado na Vercel para o domínio Clinic
- Variáveis de ambiente independentes do frontend-bakery

Variável importante para o fluxo "Solicitar Preenchimento via WhatsApp":

- `VITE_PUBLIC_ANAMNESIS_BASE_URL`: base pública usada no link de anamnese enviado ao cliente.
	- Exemplo local (LAN): `http://192.168.0.142:5173`
	- Exemplo produção: URL pública do frontend-clinic
	- Se não configurar, o sistema usa a origem atual; isso pode gerar `localhost` e quebrar em outro aparelho.

## Estrutura

- `src/`: código da aplicação
- `docs/`: documentação interna
- `public/`: assets estáticos

## Rodar localmente

```bash
npm install
npm run dev
```

## Build e testes

```bash
npm run build
npm run test
```
