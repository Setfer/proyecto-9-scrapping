const puppeteer = require('puppeteer')
const fs = require("fs");
const cartasArray = []

const scrapper = async (startUrl) => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  try {
    await page.setViewport({ width: 1080, height: 1024 })
    await page.goto(startUrl, { waitUntil: 'domcontentloaded' })
    //rechazar cookies
    await page.$eval("#truste-consent-required", (el)=>el.click())
    
    //obtener numero total de paginas
    const lastPage = await page.$$eval(
      '.Pagination_pageHightCount__yKcwn span',
      (el) => parseInt(el[el.length - 1].textContent.trim()) 
    )
    let totalPages = parseInt(lastPage)
    
    // Llamar a la funcion que repetira el scraping por cada pagina
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const url = `${startUrl}?page=${currentPage}`
      console.log(`Navegando a la URL: ${url}`)

      await page.goto(url)
      await repeat(page)

      console.log(`Página ${currentPage} completada.`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    write(cartasArray)
    await browser.close()
    console.log("Scraping finalizado.")
  }
}

const repeat = async (page) => {
  try {

    const arrayDivs = await page.$$('.Table_row__4INyY')
    console.log(arrayDivs)
    const arrayDivSinPrimero = arrayDivs.slice(1)
    console.log(arrayDivSinPrimero)

    for (const CartaDiv of arrayDivSinPrimero) {
      let GRL = await CartaDiv.$eval('.Table_statCellValue__0G9QI', (el) =>
        el.textContent.trim()
      )

      let nameConNumero = await CartaDiv.$eval('.Table_profileContent__Lna_E', (el) =>
        el.textContent.trim()
      )
      const name = nameConNumero.replace(/^[#\d]+/, '')


      let img = await CartaDiv.$$eval(
        '.Picture_image__7M4gK',
        (els) => els[1].src
      )

      const carta = { GRL, img, name }
      console.log(carta)
      cartasArray.push(carta)
    }
  } catch (error) {
    console.error('Error durante la navegación o scraping:', error)
  }
}

const write = (array) =>{
fs.writeFile("cartas.json", JSON.stringify(array), ()=>{
  console.log("archivo escrito")
})
}

scrapper('https://www.ea.com/es/games/ea-sports-fc/ratings') 
