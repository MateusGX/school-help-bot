# School Help Bot

Esse bot foi criado para auxiliar na organização e no envio das atividades para os respectivos professores.

### [DEMO](https://t.me/MajorMGX_Bot)

## Configuração

Clone o repositório e instale as dependências.

```bash
git clone https://github.com/MateusGX/major-mgx-bot.git
```

```bash
npm install
```

Inicie o bot com o comando:

```bash
npm start
```

Estrutura (.env)
```
#BOT
BOT_EMAIL=

#Telegram
BOT_TOKEN=

#EMAIL (OAUTH2)
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

## Comandos

COMANDO | DESCRIÇÃO
------- | ---------
ajuda | Mostra a lista de comandos
todas | Mostra a lista de todas as atividades
pendentes | Mostra a lista de atividades pendentes
info | Mostra as informações sobre a atividade
adicionar | Adiciona uma atividade a lista
remover | Remove uma atividade da lista
concluir | Faz o envio da atividade
cancelar | Cancela a operação em andamento
excluirconta | Exclui a conta (irreversível)
