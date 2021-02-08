export const cssMainStylesheet = `
    @import url('https://fonts.googleapis.com/css2?family=Varta&display=swap');

    body { font-family: Varta; }

    @keyframes processing {
        0% {opacity: 1;}
        100% {opacity: 0;}
    }

    html[data-pk-processing]::before {
        display: block;
        content: '●';
        position: fixed;
        right: 0.1em;
        color: rgb(192, 57, 43);
        animation-name: processing;
        animation-duration: 0.7s;
        animation-iteration-count: infinite;
        animation-direction: alternate;
    }

    .pk-token-correction {
        background-image: linear-gradient(120deg, rgba(192, 57, 43, 1) 0%, rgba(192, 57, 43, 1) 100%);
        background-repeat: no-repeat;
        background-size: 100% 0.25em;
        background-position: 0 95%;
        transition: background-size 0.25s ease-in;
    }

    .pk-token-correction:hover {
        background-image: linear-gradient(120deg, rgba(192, 57, 43, .3) 0%, rgba(192, 57, 43, .3) 100%);
        background-size: 100% 100%;
        border-radius: 0.2em;
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