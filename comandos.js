const { Markup } = require("telegraf");

class Comandos {
    constructor(bot, db) {
        this.db = db;
        this.bot = bot;
    }

    //COMANDOS DO USUÁRIO
    start(msg) {
        validarUsuario(this.db, msg, () => {
            msg.scene.leave();
            msg.replyWithMarkdown('Opaaaa! Parece que você não tem cadastro para usar esse bot. Se deseja fazer o cadastro é só apertar em `CADASTRAR`.', Markup.inlineKeyboard([
                Markup.callbackButton('CADASTRAR', 'cadastrar')
            ]).extra());
        }, () => {
            msg.replyWithMarkdown('Ebaaaaaa! Parece que você já está cadastrado, se você precisar de ajuda é só usar o comando: /ajuda');
        });
    }
    ajuda(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            msg.replyWithMarkdown("/ajuda - Mostra a lista de comandos\n/todas - Mostra a lista de todas as atividades\n/pendentes - Mostra a lista de atividades pendentes\n/info - Mostra as informações sobre a atividade\n/adicionar - Adiciona uma atividade a lista\n/remover - Remove uma atividade da lista\n/concluir - Faz o envio da atividade\n/cancelar - Cancela a operação em andamento\n/excluirconta - Exclui a conta *(irreversível)*");
        });
    }
    todas(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            this.db.all("SELECT * FROM atividades WHERE usuario=?", msg.from.id, (err, rows) => {
                if (err) {
                    msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                    console.error(err.message);
                }
                else {
                    let atividades = [];
                    for (let i = 0; i < rows.length; i++) {
                        if (rows[i].concluida == 1) {
                            atividades.push([{ text: `✅ ${rows[i].dataInicial} - (${rows[i].materia.toUpperCase()}) ${rows[i].info}`, callback_data: "none" }]);
                        } else if (rows[i].concluida == 0) {
                            atividades.push([{ text: `⚠️ ${rows[i].dataInicial} - (${rows[i].materia.toUpperCase()}) ${rows[i].info}`, callback_data: "none" }]);
                        }
                    }
                    if (rows.length == 0) {
                        msg.replyWithMarkdown("*SEM ATIVIDADES*");
                    }
                    else {
                        msg.telegram.sendMessage(
                            msg.chat.id,
                            "*ATIVIDADES:*",
                            {
                                reply_markup: {
                                    inline_keyboard: atividades
                                },
                                parse_mode: "Markdown"
                            }
                        );
                    }
                }
            });
        });
    }
    pendentes(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            this.db.all("SELECT * FROM atividades WHERE concluida='0'AND usuario=?", msg.from.id, (err, rows) => {
                if (err) {
                    msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR AS ATIVIDADES PENDENTES, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                    console.error(err.message);
                }
                else {
                    let atividades = [];
                    for (let i = 0; i < rows.length; i++) {
                        atividades.push([{ text: `${rows[i].dataInicial} -> ${rows[i].dataFinal} - (${rows[i].materia.toUpperCase()}) ${rows[i].info}`, callback_data: "none" }]);
                    }
                    if (rows.length == 0) {
                        msg.replyWithMarkdown("*SEM ATIVIDADES PENDENTES*");
                    }
                    else {
                        msg.telegram.sendMessage(
                            msg.chat.id,
                            "*ATIVIDADES PENDENTES:*",
                            {
                                reply_markup: {
                                    inline_keyboard: atividades
                                },
                                parse_mode: "Markdown"
                            }
                        );
                    }
                }
            });
        });
    }
    info(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            this.db.all("SELECT * FROM atividades WHERE usuario=?", msg.from.id, (err, result) => {
                if (err) {
                    msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                    console.error(err.message);
                }
                else {
                    let atividades = [[{ text: "CANCELAR", callback_data: "can" }]];
                    for (let i = 0; i < result.length; i++) {
                        atividades.unshift([{ text: `${result[i].dataInicial} - (${result[i].materia.toUpperCase()}) ${result[i].info}`, callback_data: `i_${result[i].id}` }]);
                    }
                    if (result.length == 0) {
                        msg.replyWithMarkdown("*SEM ATIVIDADES*");
                    }
                    else {
                        msg.telegram.sendMessage(
                            msg.chat.id,
                            "*SELECIONE A ATIVIDADE:*",
                            {
                                reply_markup: {
                                    inline_keyboard: atividades
                                },
                                parse_mode: "Markdown"
                            }
                        );
                    }
                }
            });
        });
    }
    adicionar(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            this.db.all("SELECT materias FROM usuarios WHERE usuario=?", msg.from.id, (err, rows) => {
                if (err) {
                    console.error(err);
                    msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                    return msg.scene.leave();
                }
                let data = JSON.parse(rows[0].materias);
                let dataKeys = Object.keys(data);
                if (dataKeys.length >= 1) {
                    let materias = [Markup.callbackButton("CANCELAR", "can")];
                    for (let i = 0; i < dataKeys.length; i++) {
                        materias.unshift(Markup.callbackButton(dataKeys[i].toUpperCase(), `a_${dataKeys[i]}`));
                    }
                    msg.replyWithMarkdown("*SELECIONE A MÁTERIA:*", Markup.inlineKeyboard(materias, {
                        wrap: (btn, index, currentRow) => currentRow.length >= 2 || index == materias.length - 1
                    }).extra());
                } else {
                    msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                    return msg.scene.leave();
                }
            });
        });
    }
    remover(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            this.db.all("SELECT * FROM atividades WHERE usuario=?", msg.from.id, (err, result) => {
                if (err) {
                    msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                    console.error(err.message);
                }
                else {
                    let atividades = [[{ text: "CANCELAR", callback_data: "can" }]];
                    for (let i = 0; i < result.length; i++) {
                        atividades.unshift([{ text: `${result[i].dataInicial} - (${result[i].materia.toUpperCase()}) ${result[i].info}`, callback_data: `r_${result[i].id}` }]);
                    }
                    if (result.length == 0) {
                        msg.replyWithMarkdown("*SEM ATIVIDADES*");
                    }
                    else {
                        msg.telegram.sendMessage(
                            msg.chat.id,
                            "*SELECIONE A ATIVIDADE:*",
                            {
                                reply_markup: {
                                    inline_keyboard: atividades
                                },
                                parse_mode: "Markdown"
                            }
                        );
                    }
                }
            });
        });
    }
    concluir(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            this.db.all("SELECT * FROM atividades WHERE concluida='0' AND usuario=?", msg.from.id, (err, result) => {
                if (err) {
                    msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                    console.error(err.message);
                }
                else {
                    let atividades = [[{ text: "CANCELAR", callback_data: "can" }]];
                    for (let i = 0; i < result.length; i++) {
                        atividades.unshift([{ text: `${result[i].dataFinal} - (${result[i].materia.toUpperCase()}) ${result[i].info}`, callback_data: `c_${result[i].id}_${result[i].materia}_${result[i].dataInicial}` }]);
                    }
                    if (result.length == 0) {
                        msg.replyWithMarkdown("*SEM ATIVIDADES*");
                    }
                    else {
                        msg.telegram.sendMessage(
                            msg.chat.id,
                            "*SELECIONE A ATIVIDADE:*",
                            {
                                reply_markup: {
                                    inline_keyboard: atividades
                                },
                                parse_mode: "Markdown"
                            }
                        );
                    }
                }
            });
        });
    }
    excluirconta(msg) {
        validarUsuario(this.db, msg, () => {
            msg.replyWithMarkdown("*Você não tem permisão para usar esse bot, para ter acesso realize o cadastro usando o comando: /start*\nfeito por @MateusGX");
        }, () => {
            let opt = [[{ text: "SIM :(", callback_data: `rc_${msg.from.id}` }], [{ text: "NÃO :)", callback_data: "can" }]];
            msg.telegram.sendMessage(
                msg.chat.id,
                "*DESEJA REALMENTE EXCLUIR A SUA CONTA?*",
                {
                    reply_markup: {
                        inline_keyboard: opt
                    },
                    parse_mode: "Markdown"
                }
            );
        });
    }
}
//VERIFICA SE O USUÁRIO É CADASTRADO
function validarUsuario(db, msg, naoContem, contem) {
    db.all("SELECT * FROM usuarios WHERE usuario=?", msg.from.id, (err, rows) => {
        if (err) {
            console.error(err);
            naoContem(msg);
        }
        if (rows.length == 1) {
            contem(msg);
        } else {
            naoContem(msg);
        }
    });
}

//VERIFICA SE EXISTE O COMANDO
function validarCmd(msg, cmd) {
    var cmds = ["/start", "/ajuda", "/todas", "/pendentes", "/info", "/adicionar", "/remover", "/concluir", "/cancelar", "/excluirconta"];
    if (cmds.indexOf(msg.message.text) == -1) {
        return false;
    } else {
        switch (msg.message.text) {
            case "/start":
                cmd.start(msg);
                break;
            case "/ajuda":
                cmd.ajuda(msg);
                break;
            case "/todas":
                cmd.todas(msg);
                break;
            case "/pendentes":
                cmd.pendentes(msg);
                break;
            case "/adicionar":
                cmd.adicionar(msg);
                break;
            case "/remover":
                cmd.remover(msg);
                break;
            case "/concluir":
                cmd.concluir(msg);
                break;
            case "/cancelar":
                msg.replyWithMarkdown("*AÇÃO CANCELADA*");
                break;
            case "/excluirconta":
                cmd.excluirConta(msg);
                break;
        }
        return true;
    }
}

module.exports = { Comandos, validarUsuario, validarCmd };
