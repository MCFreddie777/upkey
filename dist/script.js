"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const readline_1 = __importDefault(require("readline"));
const serversFilePath = 'servers.json';
const stbFilePath = 'stb.json';
const logFilePath = '/usr/local/etc/log.txt';
const servers = [];
let stb;
const loadServer = (serversFilePath) => {
    let file = undefined;
    try {
        file = fs_1.default.readFileSync(serversFilePath);
    }
    catch (e) {
        throw Error(`Error: Servers file missing. (${serversFilePath})`);
    }
    JSON.parse(file.toString()).forEach((server) => {
        servers.push(Object.assign(Object.assign({}, server), { update: false }));
    });
};
const loadStb = (stbFilePath) => {
    let file = undefined;
    try {
        file = fs_1.default.readFileSync(stbFilePath);
    }
    catch (e) {
        throw Error(`Error: Stb file missing. (${stbFilePath})`);
    }
    stb = JSON.parse(file.toString());
};
const check = (logFilePath, ftp = false) => {
    if (ftp) {
        child_process_1.exec(`wget ftp://${stb.ip}/usr/keys/log.txt -q --ftp-user ${stb.ftpUsername} --ftp-password ${stb.ftpPassword} && chmod 777 log.txt`);
    }
    const rd = readline_1.default.createInterface(fs_1.default.createReadStream(logFilePath));
    rd.on('line', (line) => {
        servers.forEach((s) => {
            if (line.includes(`${s.name}: login failed, usr/pwd invalid'`))
                s.update = true;
        });
    }).on('close', () => {
        if (ftp) {
            child_process_1.exec(`rm -rf log.tx* && sshpass -p ${stb.ftpPassword} ssh -l ${stb.ftpUsername} ${stb.ip} "> /usr/keys/log.txt"`);
        }
        child_process_1.exec(` > ${logFilePath}`);
    });
};
loadServer(serversFilePath);
loadStb(stbFilePath);
check(logFilePath);
