#!/usr/bin/env node

import { readdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const output = path.resolve(process.argv[2] ?? './board-data.js');
const baseDir = './d4data/json/';
const stringDir = path.join(baseDir, '/enUS_Text/meta/StringList');

const result = {
    classes: {}
};

function getStringFileFromNode(node) {
    return path.join(stringDir, `${node.groupName}_${node.name}.stl.json`);
}

function getNodeFileFromNode(node) {
    return path.format({root: baseDir, name: node.__targetFileName__, ext: '.json'});
}

function readJson(path) {
    if (existsSync(path)) {
        return JSON.parse(readFileSync(path, {encoding: 'utf8'}));
    }
    return null;
}

function cleanDescriptionText(text) {
    return text
        .replace(/{.+?}/g, '')
        .replace(/\[.+?\]/g, '')
        .replace(/\[\]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

console.log(`Writing output to ${output}`);

function buildAttributeDescriptionTable() {
    const attrData = readJson(path.join(stringDir, 'AttributeDescriptions.stl.json'));
    const attributeMap = new Map();
    attrData.arStrings.forEach(entry => {
        attributeMap.set(entry.szLabel, entry);
    });
    return attributeMap;
}

const attributeTable = buildAttributeDescriptionTable();

readdirSync(path.resolve(path.join(baseDir, '/base/meta/PlayerClass')), {encoding: 'utf8'})
    .filter(file => path.extname(file) === '.json' && file.indexOf('.pcl.') !== -1)
    .forEach(classFilename => {
        console.log(`Reading file ${path.join(baseDir, '/base/meta/PlayerClass', classFilename)}`);
        const classData = readJson(path.join(baseDir, '/base/meta/PlayerClass', classFilename));
        if (classData.snoActorMale === null && classData.snoActorFemale === null) {
            console.log(`Ignoring invalid class data file ${classFilename}`);
            return;
        }

        const className = path.basename(classData.__fileName__, path.extname(classData.__fileName__));
        console.log(`Discovered class ${className}`);
        const paragonBoards = classData.arAvailableParagonBoards.map(row => `${path.join(baseDir, row.__targetFileName__)}.json`);
        result.classes[className] = { boards: [], boardFiles: paragonBoards };
    });

Object.keys(result.classes).forEach(className => {
    result.classes[className].boardFiles.forEach((boardFilename) => {
        console.log(`Reading board ${boardFilename} for class ${className}`);

        const raw = readJson(boardFilename);
        const stringsFilename = path.join(stringDir, `ParagonBoard_${path.basename(raw.__fileName__, path.extname(raw.__fileName__))}.stl.json`);
        console.log('Reading strings file', stringsFilename);
        let strings = readJson(stringsFilename);

        let board = {
            name: strings.arStrings[0].szText,
            isStarter: false,
            width: raw.nWidth,
            gateIds: [],
            entries: [],
        };

        raw.arEntries.forEach((entry) => {
            let row = null;

            if (entry !== null) {
                row = {};
                const stringsFile = getStringFileFromNode(entry);
                const nodeFile = getNodeFileFromNode(entry);

                let strings = readJson(stringsFile);
                let nodeData = readJson(nodeFile);

                if (strings !== null) {
                    row.name = strings.arStrings[strings.ptMapStringTable].szText;
                } else {
                    const mappedAttr = attributeTable.get(nodeData.ptAttributes[0].__eAttribute_name__);
                    if (mappedAttr !== undefined) {
                        row.name = cleanDescriptionText(mappedAttr.szText);
                    } else {
                        console.log(`Couldn't find attribute`, nodeData.ptAttributes[0]);
                        row.name = nodeData.ptAttributes[0].__eAttribute_name__.replace(/_/g, ' ');
                    }
                }

                const attrs = entry.name.split('_');
                row.type = attrs[0];
                row.rarity = attrs[1];
                row.category = attrs[2];
                row.isGlyphSocket = nodeData.bHasSocket;
                row.isGate = nodeData.bIsGate;
                // unk_7714b98 seems to be some sort of node type specifier, 5 seems to be the start node
                row.isStart = nodeData.unk_7714b98 === 5;
                row.id = board.entries.length;

                row.x = Math.floor(board.entries.length / board.width);
                row.y = board.entries.length % board.width;

                if (row.isStart) {
                    board.isStarter = true;
                    board.starterId = row.id;
                }

                if (row.isGate) {
                    board.gateIds.push(row.id);
                }

                // console.log(`Adding entry ${row.name}`);
            }

            board.entries.push(row);
        });

        console.log(`Adding board ${board.name}`);
        board.id = result.classes[className].boards.length;
        result.classes[className].boards.push(board);
    });
    delete result.classes[className].boardFiles;
})

console.log('Writing data');
writeFileSync(output, 'export default ' + JSON.stringify(result, null, 4));
console.log('Done!');
