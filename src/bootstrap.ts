import { configure, mount } from "@codewithkyle/router";

const main = document.body.querySelector("main");
mount(main);

// Configure the router
configure({
    "*": {
        tagName: "home-page",
        file: "./homepage.js",
    },
});