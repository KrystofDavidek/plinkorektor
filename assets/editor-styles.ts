export const cssMainStylesheet = `
    :root {
        --font-green: #01a746;
        --green: #2ee59d;
        --dark-green: #13be79;
        --shadow-green: rgba(46, 229, 157, 0.4);
        --grey: rgba(0, 0, 0, 0.1);
        --light-red: rgb(251, 160, 160);
        --nav-h: 10vh;
        --main-p: 5%;
        --main-p-t: 5%;
        --main-p-l-extra: 10%;
        --loader-grey: #868686;
        }

        .disable-overflow {
             overflow: hidden !important;
        }

        
    ::-webkit-scrollbar {
        width: 10px;
    }
        
    /* Track */
    ::-webkit-scrollbar-track {
        box-shadow: inset 0 0 5px rgb(183, 181, 181);
        border-radius: 10px;
    }
        
    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: var(--shadow-green);
        border-radius: 10px;
    }
        
    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: var(--dark-green);
    }

    @import url('https://fonts.googleapis.com/css2?family=Varta&display=swap');

    body { font-family: Varta; }

    @keyframes processing {
        0% {opacity: 1;}
        100% {opacity: 0;}
    }

    @keyframes fade-out {
        from {
  	        opacity: 1;
            }
    }

    [data-pk-unprocessed] {
        background-color: rgba(255,0,0, 0.4);
    }

    [data-tooltip]:before {            
        position : absolute;
        content : attr(data-tooltip);
        opacity : 0;
        right: 0;
        left: 0;
        text-align: center;
        background: rgba(255, 255, 255, 0.6);
    }

    [data-tooltip]:hover:before {        
        opacity : 1;
    }

    .disable-editor {
            filter: blur(1px);
             -webkit-filter: blur(1px);
            cursor: not-allowed;
            pointer-events: none;     
    }

    .loader-container {
        position: absolute;
        height: 100%;
        width: 100%;
    }

    .loader {
     position: absolute;
    top: 30%;
    left: 40%;
    border: 16px solid var(--loader-grey);
    border-top: 16px solid var(--green);
    border-radius: 50%;
    width: 8rem;
    height: 8rem;
    animation: spin 2s linear infinite;
}

@media screen and (max-width: 500px) {
  .loader {
    width: 4rem;
    height: 4rem;
}
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}


   

    .pk-token-correction {
        background-image: linear-gradient(120deg, rgba(192, 57, 43, 1) 0%, rgba(192, 57, 43, 1) 100%);
        background-repeat: no-repeat;
        background-size: 100% 0.25em;
        background-position: 0 95%;
        transition: background-size 0.25s ease-in;
    }

    .pk-token-correction:hover, .pk-token-correction.hovered {
        background-image: linear-gradient(120deg, rgba(192, 57, 43, .3) 0%, rgba(192, 57, 43, .3) 100%);
        background-size: 100% 100%;
        border-radius: 0.2em;
    }

     @keyframes fixed {
         from {  background-color: rgba(76, 206, 76, 1); }
        to {   background-color: white;}
    }


    .pk-token-correction-fixed {
        border-radius: 0.2em;
        animation-name: fixed;
        animation-duration: 4s;
    }
`;

export const cssMistakeDescription = `
    color: rgb(149, 165, 166);
    font-size: .7em;
    text-transform: uppercase;
`;

export const cssMistakeBadValue = `
    text-decoration: underline rgb(192, 57, 43);
    font-weight: bold;
`;

export const themeCustomization = `
.tox .tox-button {
    text-transform: none !important;
}
`;

export const cssMistakeNoCorrection = `
    color: #222f3e;
    font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: normal;
    line-height: 24px;
`;
