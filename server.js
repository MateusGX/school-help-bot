//MÓDULOS
const { Telegraf, Stage, session } = require('telegraf');
const WizardScene = require('telegraf/scenes/wizard');
const sqlite3 = require('sqlite3');

//MÓDULOS DO BOT
const { Comandos, validarCmd } = require('./comandos');
const { enviar } = require('./email');

//CRIA O ARQUIVO DO BANCO DE DADOS
var db = new sqlite3.Database('mgx-db.db');

//CRIA A TABELA DE ATIVIDADES SE NÃO EXISTIR
db.run(`CREATE TABLE IF NOT EXISTS atividades (
    id INTEGER NOT NULL,
    dataInicial varchar(255) NOT NULL,
    dataFinal varchar(255) NOT NULL,
    materia varchar(255) NOT NULL,
    info longtext NOT NULL,
    usuario varchar(255) NOT NULL,
    concluida int(11) NOT NULL DEFAULT '0',
    PRIMARY KEY ('id')
    )`);

//CRIA A TABELA DE USUÁRIOS SE NÃO EXISTIR
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER NOT NULL,
    usuario varchar(255) NOT NULL,
    dados longtext NOT NULL,
    materias longtext NOT NULL,
    PRIMARY KEY ('id')
    )`);

//CRIA O BOT
const bot = new Telegraf("BOT_TOKEN");

//CRIA AS FUNÇÕES DOS COMANDOS
const cmd = new Comandos(bot, db);

//SISTEMA DE CADASTRO
const passosCadastro = new WizardScene('passos-cadastro',
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            }
            return ctx.scene.leave();
        } else {
            ctx.wizard.state.data = {};
            ctx.replyWithMarkdown("*Qual o seu nome?* (Será usado no e-mail)");
            return ctx.wizard.next();
        }
    },
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            } else {
                ctx.wizard.state.data.nome = ctx.message.text;
                ctx.replyWithMarkdown("(OPCIONAL) *Por padrão no e-mail irá aparecer o seu nome, caso queira adicionar alguma mensagem ou informação essa é a hora, caso não queira é só mandar:*\n`nada`");
                return ctx.wizard.next();
            }
        } else {
            ctx.wizard.back();
            return ctx.wizard.steps[0](ctx);
        }
    },
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            } else {
                if (ctx.message.text.toUpperCase() == 'NADA') {
                    ctx.wizard.state.data.emailInfo = ' ';
                } else {
                    ctx.wizard.state.data.emailInfo = ctx.message.text;
                }
                ctx.replyWithMarkdown("*Já estamos quase terminando o seu cadastro, agora vamos configurar as máterias e os e-mails dos professores(as), para isso mande os dados da sequinte forma:*\n`materia:e-mail,materia:e-mail`");
                return ctx.wizard.next();
            }
        } else {
            ctx.wizard.back();
            return ctx.wizard.steps[1](ctx);
        }
    },
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            } else {
                if (ctx.message.text.indexOf(':') == -1) {
                    ctx.wizard.back();
                    return ctx.wizard.steps[2](ctx);
                }
                let profs = ctx.message.text.split(',');
                let profsObj = {};
                for (let i = 0; i < profs.length; i++) {
                    profsObj[profs[i].split(':')[0]] = profs[i].split(':')[1];
                }
                db.run(`INSERT INTO usuarios (usuario, dados, materias) 
                VALUES ('${ctx.from.id}', '${JSON.stringify(ctx.wizard.state.data)}', '${JSON.stringify(profsObj)}')`,
                    (err) => {
                        if (err) {
                            ctx.replyWithMarkdown("*OCORREU UM ERRO NO CADASTRO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                            console.error(err.message);
                        }
                        else {
                            ctx.replyWithMarkdown("Estamos finalizando o seu cadastro, por favor aguarde.");
                            ctx.replyWithMarkdown("*CADASTRO CONCLUÍDO*");
                            ctx.replyWithMarkdown("Agora você já tem acesso a todas as funcionalidades desse bot, caso precise de ajuda é só usar o comando: /ajuda");
                            return ctx.scene.leave();
                        }
                    }
                );
            }
        } else {
            ctx.wizard.back();
            return ctx.wizard.steps[2](ctx);
        }
    }
);

//SISTEMA DE ADICIONAR ATIVIDADE
const addAtv = new WizardScene('adicionar-atv',
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            }
            return ctx.scene.leave();
        } else {
            ctx.wizard.state.data = {};
            ctx.replyWithMarkdown("*DATA DE ENTREGA (00/00):*");
            return ctx.wizard.next();
        }
    },
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            } else {
                ctx.wizard.state.data.dFinal = ctx.message.text;
                ctx.replyWithMarkdown("*INFORMAÇÕES DA ATIVIDADE:*");
                return ctx.wizard.next();
            }
        } else {
            ctx.wizard.back();
            return ctx.wizard.steps[0](ctx);
        }
    },
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            } else {
                let data = new Date();
                db.run(`INSERT INTO atividades (dataInicial, dataFinal, materia, info, usuario) 
                VALUES ('${(data.getDate() < 9) ? ('0' + data.getDate()) : data.getDate()}/${(data.getMonth() < 9) ? ('0' + (Number(data.getMonth()) + 1)) : (data.getMonth() + 1)}', 
                '${ctx.wizard.state.data.dFinal}', 
                '${ctx.session.a_mat}', 
                '${ctx.message.text}', 
                '${ctx.from.id}')`,
                    (err) => {
                        if (err) {
                            ctx.replyWithMarkdown("*OCORREU UM ERRO AO ADICIONAR A ATIVIDADE, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                            console.error(err.message);
                        }
                        else {
                            ctx.session.a_mat = "";
                            ctx.replyWithMarkdown("*ATIVIDADE ADICIONADA*");
                            return ctx.scene.leave();
                        }
                    }
                );
            }
        } else {
            ctx.wizard.back();
            return ctx.wizard.steps[1](ctx);
        }
    }
);

//SISTEMA DE REMOVER ATIVIDADE
const concluirAtv = new WizardScene('concluir-atv',
    (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            }
            return ctx.scene.leave();
        } else {
            ctx.replyWithMarkdown("*POR FAVOR SELECIONE O ARQUIVO QUE DESEJA ENVIAR:*");
            return ctx.wizard.next();
        }
    },
    async (ctx) => {
        if (ctx.message != null && ctx.message.text != "") {
            if (validarCmd(ctx, cmd)) {
                return ctx.scene.leave();
            } else {
                if (ctx.message.document != null) {
                    await enviarAtv(ctx);
                } else {
                    ctx.wizard.back();
                    return ctx.wizard.steps[0](ctx);
                }
            }
        } else {
            ctx.wizard.back();
            return ctx.wizard.steps[0](ctx);
        }
    }
);

const passo = new Stage([passosCadastro, addAtv, concluirAtv]);
bot.use(session())
bot.use(passo.middleware());

//COMANDOS DO BOT
bot.command('/start', (ctx) => cmd.start(ctx));
bot.command('/ajuda', (ctx) => cmd.ajuda(ctx));
bot.command('/todas', (ctx) => cmd.todas(ctx));
bot.command('/pendentes', (ctx) => cmd.pendentes(ctx));
bot.command('/info', (ctx) => cmd.info(ctx));
bot.command('/adicionar', (ctx) => cmd.adicionar(ctx));
bot.command('/remover', (ctx) => cmd.remover(ctx));
bot.command('/concluir', (ctx) => cmd.concluir(ctx));
bot.command('/excluirconta', (ctx) => cmd.excluirconta(ctx));
//FUNÇÃO DOS BOTÕES
bot.on('callback_query', (ctx) => {
    if (ctx.callbackQuery.data == 'cadastrar') {
        ctx.editMessageText("*SELECIONADO*", { parse_mode: "Markdown" });
        ctx.scene.enter('passos-cadastro');
    } else if (ctx.callbackQuery.data.split('_')[0] == 'a') {
        ctx.editMessageText("*SELECIONADO*", { parse_mode: "Markdown" });
        ctx.session.a_mat = ctx.callbackQuery.data.split('_')[1];
        ctx.scene.enter('adicionar-atv');
    } else if (ctx.callbackQuery.data.split('_')[0] == 'r') {
        ctx.editMessageText("*SELECIONADO*", { parse_mode: "Markdown" });
        db.run("DELETE FROM atividades WHERE id=?", ctx.callbackQuery.data.split('_')[1], (err) => {
            if (err) {
                ctx.replyWithMarkdown("*OCORREU UM ERRO AO REMOVER A ATIVIDADE, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                console.error(err.message);
            }
            else {
                ctx.replyWithMarkdown("*ATIVIDADE REMOVIDA*");
            }
        });
    } else if (ctx.callbackQuery.data.split('_')[0] == 'rc') {
        ctx.editMessageText("*SELECIONADO*", { parse_mode: "Markdown" });
        db.run("DELETE FROM atividades WHERE usuario=?", ctx.callbackQuery.data.split('_')[1], (err) => {
            if (err) {
                ctx.replyWithMarkdown("*OCORREU UM ERRO AO REMOVER A CONTA, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                console.error(err.message);
            }
            else {
                db.run("DELETE FROM usuarios WHERE usuario=?", ctx.callbackQuery.data.split('_')[1], (err_u) => {
                    if (err_u) {
                        ctx.replyWithMarkdown("*OCORREU UM ERRO AO REMOVER A CONTA, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                        console.error(err_u.message);
                    }
                    else {
                        ctx.replyWithMarkdown("*CONTA REMOVIDA*");
                    }
                });
            }
        });
    } else if (ctx.callbackQuery.data.split('_')[0] == 'i') {
        ctx.editMessageText("*SELECIONADO*", { parse_mode: "Markdown" });
        db.all("SELECT * FROM atividades WHERE id=?", ctx.callbackQuery.data.split('_')[1], (err, rows) => {
            if (err) {
                ctx.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR OS DADOS DA ATIVIDADE, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                console.error(err.message);
            }
            else {
                if (rows.length >= 1) {
                    ctx.replyWithMarkdown(`*Matéria:* ${rows[0].materia}\n*Passada:* ${rows[0].dataInicial}\n*Entrega:* ${rows[0].dataFinal}\n*Informações:* ${rows[0].info}`);
                }
            }
        });
    } else if (ctx.callbackQuery.data.split('_')[0] == 'c') {
        ctx.editMessageText("*SELECIONADO*", { parse_mode: "Markdown" });
        ctx.session.c_atv = ctx.callbackQuery.data.split('_')[1];
        ctx.session.c_atv_mat = ctx.callbackQuery.data.split('_')[2];
        ctx.session.c_atv_data = ctx.callbackQuery.data.split('_')[3];
        ctx.scene.enter('concluir-atv');
    } else if (ctx.callbackQuery.data == 'can') {
        ctx.editMessageText("*CANCELADO*", { parse_mode: "Markdown" });
    }
});

//FUNÇÃO PARA ENVIAR ATIVIDADE
async function enviarAtv(ctx) {
    ctx.replyWithMarkdown("Por favor aguarde enquanto processamos o seu e-mail.");
    try {
        let file = await bot.telegram.getFile(ctx.message.document.file_id);
        db.all("SELECT * FROM usuarios WHERE usuario=?", ctx.from.id, (error, result) => {
            if (error) {
                ctx.replyWithMarkdown("*OCORREU UM ERRO NO NOSSO BANCO DE DADOS, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                console.error(error.message);
                return msg.scene.leave();
            } else {
                let dados = JSON.parse(result[0].dados);
                enviar(ctx, db, ctx.session.c_atv_mat, ctx.session.c_atv_data, ctx.message.document.file_name, `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`, dados['nome'], dados['emailInfo']);
            }
        });
    }
    catch (error){
        ctx.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR O ARQUIVO, POR FAVOR REDUZA O TAMANHO DO ARQUIVO.");
    }
}

//INICIA O BOT
bot.launch();
