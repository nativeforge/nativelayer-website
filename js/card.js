class card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'})
  }

    connectedCallback(){
      this.shadowRoot.innerHTML = `
      <style>
        div {color:red}
        [name="title"]{ color: blue}
        [name="body"]{ color: green; box-shadow: 0 0 0 2px green}
        .card-container{
          display: flex; flex-direction: column;
          justify-content: start;
          width: 100%;
          box-shadow: 0 0 0 1px black;
        }
      </style>
      <div class="card-container">
        <slot></slot>
        <h1><slot name="title"></slot></h1>
        <slot name="body"></slot>

      </div>`
    }
  }

  export default card