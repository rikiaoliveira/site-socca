# MS Galaxy — Site da Equipa

Site oficial do MS Galaxy para a Liga 2 Amora 2026.
Puxa dados em tempo real da API do MyGol (soccaportugal.mygol.es).

---

## Como instalar e correr (passo a passo)

### 1. Instalar Node.js
- Vai a https://nodejs.org e instala a versão **LTS**
- Depois abre o PowerShell e testa:
```
node -v
npm -v
```
Se aparecer uma versão em ambos, está ok.

### 2. Instalar VS Code
- Vai a https://code.visualstudio.com e instala

### 3. Preparar o projeto
- Copia a pasta `site-socca` para onde quiseres no teu PC
- Abre o PowerShell nessa pasta
- Corre:
```
npm install
```
Isto instala todas as dependências. Vai demorar uns segundos.

### 4. Correr o site localmente
```
npm run dev
```
Depois abre no browser:
```
http://localhost:3000
```
Deves ver o site com os dados a vir da API em tempo real!

### 5. Publicar no Vercel

#### a) Criar conta no GitHub
- Vai a https://github.com e cria uma conta (se não tiveres)
- Cria um novo repositório (ex: `site-socca`)

#### b) Enviar o projeto para o GitHub
No PowerShell, dentro da pasta do projeto:
```
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/TEU-USER/site-socca.git
git push -u origin main
```
(substitui `TEU-USER` pelo teu username do GitHub)

#### c) Ligar ao Vercel
- Vai a https://vercel.com e cria conta com o GitHub
- Clica em "New Project"
- Seleciona o repositório `site-socca`
- Clica em "Deploy"
- Espera uns segundos e está online!

---

## Estrutura do projeto

```
site-socca/
├── app/
│   ├── globals.css          ← estilos globais
│   ├── layout.tsx           ← layout base
│   └── page.tsx             ← página principal (busca dados da API)
├── components/
│   └── SiteClient.tsx       ← todo o UI (hero, classificação, etc)
├── lib/
│   └── api.ts               ← chamadas à API do MyGol
├── next.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

## Endpoints da API usados

| Dados | Endpoint |
|-------|----------|
| Classificação | `/api/tournaments/stageclassification/303` |
| Equipa + Jogadores + Calendário | `/api/teams/2794/details/250` |
| Top Marcadores | `/api/tournaments/250/ranking/players/scorers/1/999` |
| Top Assistências | `/api/tournaments/250/ranking/players/assistances/1/999` |
| MVPs | `/api/tournaments/250/ranking/players/mvps/1/999` |

Os dados são revalidados a cada 5 minutos automaticamente.

## Notas
- As imagens vêm de `https://soccaportugal.mygol.es/imagesv2/`
- O cap de jogos por jogador é calculado automaticamente com base nos jogos oficiais jogados
- Quando houver novas jornadas, os dados atualizam-se sozinhos
