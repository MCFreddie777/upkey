"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const readline_1 = __importDefault(require("readline"));
const axios_1 = __importDefault(require("axios"));
const serversFilePath = 'servers.json';
const stbFilePath = 'stb.json';
const logFilePath = '/usr/local/etc/log.txt';
let servers = [];
let stb;
const loadServer = (serversFilePath, sortAndPrint = false) => {
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
    if (sortAndPrint) {
        servers.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        console.log('Servers: ', servers);
    }
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
const update = (printErrors = false) => {
    return servers
        .filter((s) => s.update)
        .map((server) => {
        return axios_1.default
            .get(server.url)
            .then((response) => {
            if (response.data &&
                (response.data.includes('C: ') ||
                    response.data.includes('c: '))) {
                const index = response.data.indexOf('C: ') < 0
                    ? response.data.indexOf('c: ')
                    : response.data.indexOf('C: ');
                const arr = response.data
                    .substr(index)
                    .replace('\n', ' ')
                    .replace('\r', ' ')
                    .split(' ')
                    .map((str) => str.trim());
                const key = {
                    ip: arr[1],
                    port: arr[2],
                    user: arr[3],
                    pass: arr[4],
                };
                console.log(`Request: http://${stb.ip}:${stb.port}/readerconfig.html?label=${server.name}&protocol=cccam&device=${key.ip}%2C${key.port}&group=${server.group}&services=skylink&services=upc&services=digi&services=skyuk&services=skyde&user=${key.user}&password=${key.pass}&cccversion=2.3.0&action=Save`);
                return child_process_1.exec(`wget -q --spider --user ${stb.oscUsername} --password ${stb.oscPassword} "http://${stb.ip}:${stb.port}/readerconfig.html?label=${server.name}&protocol=cccam&device=${key.ip}%2C${key.port}&group=${server.group}&services=skylink&services=upc&services=digi&services=skyuk&services=skyde&user=${key.user}&password=${key.pass}&cccversion=2.3.0&action=Save"`);
            }
            return;
        })
            .catch((err) => {
            if (printErrors)
                console.error(err);
        });
    });
};
loadServer(serversFilePath);
loadStb(stbFilePath);
check(logFilePath);
const requests = update(false);
Promise.all(requests)
    .then(() => {
    console.log(`Done. (${requests.length})`);
})
    .catch((err) => {
    console.log('Something went wrong: ');
    console.error(err);
});
