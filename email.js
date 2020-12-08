//MÓDULOS
const nodemailer = require('nodemailer');
const PassThrough = require('stream').PassThrough;
const { google } = require('googleapis');
const request = require('request');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    'CLIENT ID',
    'CLIENT SECRET',
    'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({
    refresh_token: 'REFRESH TOKEN FROM OAUTH PLAYGROUND'
});
const accessToken = oauth2Client.getAccessToken();

const smtpTransport = new nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'EMAIL',
        clientId: 'CLIENT ID',
        clientSecret: 'CLIENT SECRET',
        refreshToken: 'REFRESH TOKEN FROM OAUTH PLAYGROUND',
        accessToken: accessToken
    }
});

function enviar(msg, db, materia, atv_data, anexo, url, nome, dados) {
    db.all("SELECT materias FROM usuarios WHERE usuario=?", msg.from.id, (err, rows) => {
        if (err) {
            console.error(err);
            msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
            return msg.scene.leave();
        }
        let data = JSON.parse(rows[0].materias);
        let urlStream = new PassThrough();
        request.get({
            url: url
        }).on('error', (error) => {
            msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
            console.error(error);
            return msg.scene.leave();
        }).pipe(urlStream);
        let mailOptions = {
            from: `${nome} <EMAIL>`,
            to: data[materia],
            subject: `[${atv_data}] - Atividade`,
            text: `Aluno(a):${nome}\n${dados}`,
            attachments: [
                {
                    filename: anexo,
                    content: urlStream
                }
            ]
        };
        smtpTransport.sendMail(mailOptions, (error, response) => {
            if (error) {
                console.error(error);
                msg.replyWithMarkdown("*OCORREU UM ERRO AO PROCESSAR ESSE COMANDO, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                return msg.scene.leave();
            } else {
                msg.replyWithMarkdown("*ENVIANDO ATIVIDADE...*");
                db.run("UPDATE atividades SET concluida=1 WHERE id=?", msg.session.c_atv,
                    (error_db) => {
                        if (error_db) {
                            msg.replyWithMarkdown("*OCORREU UM ERRO NO NOSSO BANCO DE DADOS, POR FAVOR TENTE NOVAMENTE MAIS TARDE.*");
                            console.error(error_db.message);
                            return msg.scene.leave();
                        } else {
                            msg.replyWithMarkdown("*ATIVIDADE ENVIADA*");
                            return msg.scene.leave();
                        }
                    }
                );
            }
        });
    });
}

module.exports = { enviar };
