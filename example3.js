let fs = require('fs'),
    readline = require('readline'),
    Stream = require('stream'),
    transliterate = require('transliteration').slugify,
    program = require('commander'),
    config = require('./config.json');

program
    .version('0.0.1')
    .option('-i, --input [input]', 'Csv file input *.csv (default "./test.csv")', 'test.csv')
    .option('-o, --output [output]', 'output json file *.json  (default "./orgf.ttl")', 'orgf.ttl')
    .option('-p, --preface [preface]', 'ontology preface file *.ttl  (default "./preface.ttl")', 'preface.ttl')
    .option('-n, --new [new]', 'create new or add data to existing (default "y")', 'y')
    .parse(process.argv);

let header = [
    "IID",
    "word",
    "code",
    "code_parent",
    "type",
    "type_sub",
    "type_ssub",
    "plural",
    "gender",
    "wcase",
    "comp",
    "soul",
    "transit",
    "perfect",
    "face",
    "kind",
    "time",
    "inf",
    "vozv",
    "nakl",
    'short'
];

let rl, inStream, outStream;
let isNew = (program.new == 'y') ? true : false;
if (isNew) {
    createExportFile(program.preface, program.output)
    .then(msg => {
        console.log(msg);
        createReadStream(program.input);
    })
    .catch(e => console.log(e))
}
else {
    createReadStream(program.input);
}

// createReadStream(program.input);

function createReadStream(filename) {
    inStream = fs.createReadStream(filename);
    outStream = new Stream;
    rl = readline.createInterface(inStream, outStream);

    rl.on('line', (line) => {
        doSomethingWithLine(line);
    });
    
    rl.on('close', () => {
        createWordArt(queue);
        console.log('all done 🤘')
    });
}

let token;
let tokens = [];
let counter = 0;
let queue = {};
let parentCode;
function doSomethingWithLine(line) {
    if (line[0] == '(') {
        line = line.trim();
        line = line.replace(/^\(/, '');
        line = line.replace(/\).+$/, '');
        let openQuote = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] == "'" && !openQuote) {
                openQuote = true;
                i++;
            }
            if (line[i] == "'" && openQuote) openQuote = false;
            if (line[i] == "," && openQuote) {
                // console.log(line);
                line = line.substr(0, i) + '-' + line.substr(i + 1);
                
            }
        }
        let columns = line.split(',');
        if (columns.length != header.length) columns.push('');

        if (columns.length != header.length) {
            console.log(columns, columns.length, header.length);
            process.exit(1);
        }

        let obj = {};
        for (let c, i = 0; i < columns.length; i++) {
            c = columns[i];
            c = c.replace(/'/g, '');
            c = c.trim();
            obj[header[i]] = c;
        }        
        let newObj = {};
        let lemmas = {};
        let name = "";
        
        if (obj.code_parent == 0) {
            parentCode = obj.code;
            createWordArt(queue);
            queue = {};
            queue[obj.code_parent] = [];
        }
        else {
            if (!queue.hasOwnProperty(obj.code_parent)) queue[obj.code_parent] = [];
        }

        queue[obj.code_parent].push(obj);


        console.log(`${counter++}`);
    }
}

let indent = '    ';
let newLineIndent = '\n' + indent;

function createWordArt(queue) {
    if (Object.keys(queue).length == 0) return;
    let lemmaId = '';
    let allFormsId = [];
    let tr = '';
    let lineEnd = ";";
    let viewed = [];
    
    let a = queue["0"];
    
    lemmaId = `:${transliterate(a[0]["word"])}_${a[0]["code"]}`;
    
    for(parentCode in queue) {
        let depArray = queue[parentCode];
        depArray.forEach( (dep) => {
            allFormsId.push( createForm(dep) );
        });
    };

    tr += `${lemmaId} a ontolex:Word ;`
    tr += `${newLineIndent}ontolex:canonicalForm ${lemmaId} ;`
    tr += `${newLineIndent}ontolex:otherForm ${allFormsId.join(', ')} .\n\n`;



    fs.appendFileSync(program.output, tr);
    


    function createForm(obj) {
        let formsId = [];
            if(viewed.indexOf(obj.code) != 1) {
                let id = ":" + transliterate(obj.word);
                id += "_";
                id += obj.code;
                formsId.push(id);
                // formsId.push(obj.code);
                viewed.push(obj.code);
                // tr += `:${obj.code}_${obj.word} a ontolex:Form ;`;
                tr += `${id} a ontolex:Form ;`;
                tr += `${newLineIndent}ontolex:writtenRep "` + obj.word + `"@ru ;`;
                let morph = [];
                for (let key in obj) {
                    let val = obj[key];
                    if (config.hasOwnProperty(key)) {
                        if (config[key].hasOwnProperty(val)) {
                            if(config[key][val] != "") {
                                morph.push(`${newLineIndent}${config[key][val]}`);
                            }
                        }
                    }
                }
                tr += morph.join(' ;')
                if(queue.hasOwnProperty(obj.code)) {
                    // console.log(queue[obj.code]);
                    let bla = [];
                    for(let i = 0; i < queue[obj.code].length; i++) {
                        let id = ":" + transliterate(queue[obj.code][i]["word"]);
                        id += "_";
                        id += queue[obj.code][i]["code"];
                        bla.push(id);
                        // bla.push(queue[obj.code][i]["code"]);
                    }
                    tr += ` ;${newLineIndent}ontolex:otherForm ${bla.join(', ')}`;
                }
                tr += ' .\n\n';
            }
            
            return formsId;
    };
    
}

function createExportFile(preface, output) {
    return new Promise ( (resolve, reject) => {
        
        fs.readFile(preface, (err, prefaceData) => {
            if(err) reject (err);
            else {
                fs.stat(output, (err, stat) => {
                    if (!err) {
                        fs.unlink(output);
                        console.log(`Old otput file "${output}" deleted`);
                    }
                    fs.appendFile(output, prefaceData, err => {
                        if (err) reject (err);
                        else resolve ('Create output file. Ok')
                    })
                })
            }
        })
    })
}

/*
function createWordArt_OLD(queue) {
    if (queue.length == 0) return

    let lemmaId = '';
    let formsId = [];
    let tr = '';
    let lineEnd = ";";
    lemmaId = `${queue[0].code}_${transliterate(queue[0].word)}`;

    // Forms
    // :5765765_word a ontolex:Form ;
    //     ontolex:writtenRep "ёж"@ru ;
    //     lexinfo:number lexinfo:singular ;
    //     lexinfo:case lexinfo:nominativeCase .
    queue.forEach(element => {

        let name = transliterate(element.word);
        formsId.push(`${element.code}_${name}`);
        
        tr += `${element.code}_${name} a ontolex:Form ;`;
        tr += `${newLineIndent}ontolex:writtenRep "` + element.word + `"@ru ;`;
        let morph = [];
        
        for (let key in element) {
            let val = element[key];
            if (config.hasOwnProperty(key)) {
                if (config[key].hasOwnProperty(val)) {
                    if(config[key][val] != "") {
                        morph.push(`${newLineIndent}${config[key][val]}`);
                    }
                }
            }
        }

        tr += morph.join(' ;')
        tr += ' .\n\n';

    });

    // Word
    // :???_$lemma_word a ontolex:Word ;
    //     ontolex:canonicalForm :lemmaId ;
    //     ontolex:otherForm :form1id, form2id .

    tr += `${lemmaId} a ontolex:Word ;`
    tr += `${newLineIndent}ontolex:canonicalForm ${lemmaId} ;`
    tr += `${newLineIndent}ontolex:otherForm ${formsId.join(', ')} .\n\n`;
    
    fs.appendFileSync(program.output, tr);
}
*/
