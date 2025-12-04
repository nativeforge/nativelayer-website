class elPara extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `<p>Paragraphe spécial</p>`
  }
  connectedCallback(){
    this.addEventListener('click', () => {
      this.innerHTML = `<p>Paragraphe spécial modifié sur click</p>`
    })

  }
}

export default elPara