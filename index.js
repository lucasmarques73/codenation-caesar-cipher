const fs = require("fs")
const FormData = require("form-data")
const https = require("https")
const sha1 = require("js-sha1")

async function getData() {
    return new Promise((resolve) => {
        https
            .request({
                    host: "api.codenation.dev",
                    path: "/v1/challenge/dev-ps/generate-data?token=e60326a766a27d3b6bc83e062bb55278e58f5653",
                    method: "GET",
                },
                (response) => {
                    const chunks = []
                    response.on("data", (chunk) => {
                        chunks.push(chunk)
                    })
                    response.on("end", () => {
                        const result = Buffer.concat(chunks).toString()
                        resolve(JSON.parse(result))
                    })
                    response.on("error", (error) => console.log(error))
                }
            )
            .end()
    })
}

async function sendData() {
    return new Promise((resolve) => {
        const formData = preparaForm()
        const req = https.request({
                host: "api.codenation.dev",
                path: "/v1/challenge/dev-ps/submit-solution?token=e60326a766a27d3b6bc83e062bb55278e58f5653",
                method: "POST",
                headers: formData.getHeaders(),
            },
            (response) => {
                const chunks = []
                response.on("data", (chunk) => {
                    chunks.push(chunk)
                })
                response.on("end", () => {
                    const result = JSON.parse(Buffer.concat(chunks).toString())
                    resolve(result)
                })
                response.on("error", (err) => console.error(err))
            }
        )
        formData.pipe(req)
    })
}

function readFile() {
    return fs.createReadStream("answer.json")
}

function writeJSON(data) {
    fs.writeFileSync("answer.json", JSON.stringify(data, null, 4), "utf-8")
}

function preparaForm() {
    let formData = new FormData()
    const file = readFile()
    formData.append("answer", file)
    return formData
}

function decryptLetter(letter, key) {
    let unshiftedLetter
    const charCode = letter.charCodeAt()

    if (97 <= charCode && charCode <= 122) {
        unshiftedLetter = String.fromCharCode(122 - ((122 - charCode + key) % 26))
    } else {
        unshiftedLetter = letter
    }

    return unshiftedLetter
}

async function main() {
    let data = await getData()

    writeJSON(data)

    const decryptedPhrase = Array.from(data.cifrado.toLowerCase())
        .map((letter) => decryptLetter(letter, data.numero_casas))
        .join("")

    data.decifrado = decryptedPhrase
    data.resumo_criptografico = sha1(decryptedPhrase)
    writeJSON(data)

    console.log(data)
    const score = await sendData()
    console.log(score)
}

main()