// ==UserScript==
// @name         Neeva Quick Answers
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Add duckduckgo-like quick answers to Neeva.
// @author       Snaddyvitch Dispenser (https://github.com/Snaddyvitch-Dispenser)
// @match        https://neeva.com/search?q=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=neeva.com
// @grant        none
// @updateURL    https://git.dbuidl.com/Snaddyvitch-Dispenser/neeva-quick-answers/raw/branch/main/neevaquickanswers.user.js
// @downloadURL  https://git.dbuidl.com/Snaddyvitch-Dispenser/neeva-quick-answers/raw/branch/main/neevaquickanswers.user.js
// ==/UserScript==

// needs to be incremented each time the HTML changes
const version = "0.6";

const quickAnswers = [
    {
        test: (q) => {let s = q.split(" "); return s[0].toLowerCase() === "sha256" && q.length >= 2},
        answer: async function(q) {
            try {
                const toHash = q.substr(q.indexOf(" ")).trim();

                const textAsBuffer = new TextEncoder().encode(toHash);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', textAsBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer))
                const digest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                return [digest, `sha256 hex hash`];
            } catch (e) {
                return null;
            }
        },
        authors: [{name: "Conor", url: "https://github.com/Snaddyvitch-Dispenser", icon: "https://images.hive.blog/u/cadawg/avatar"}],
        name: "SHA-256 Hash",
    },
    {
        test: (q) => {let s = q.split(" "); return s[0].toLowerCase() === "sha512" && q.length >= 2},
        answer: async function(q) {
            try {
                const toHash = q.substr(q.indexOf(" ")).trim();

                const textAsBuffer = new TextEncoder().encode(toHash);
                const hashBuffer = await window.crypto.subtle.digest('SHA-512', textAsBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer))
                const digest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                return [digest, `sha512 hex hash`];
            } catch (e) {
                return null;
            }
        },
        authors: [{name: "Conor", url: "https://github.com/Snaddyvitch-Dispenser", icon: "https://images.hive.blog/u/cadawg/avatar"}],
        name: "SHA-512 Hash",
    },
    {
        test: (q) => {let s = q.split(" "); return s[0].toLowerCase() === "urlencode" && q.length >= 2},
        answer: async (q) => {
            try {
                const toEncode = q.substr(q.indexOf(" ")).trim();

                const digest = encodeURIComponent(toEncode);

                return [digest, `URL encode: ${toEncode}`];
            } catch (e) {
                return null;
            }
        },
        authors: [{name: "Conor", url: "https://github.com/Snaddyvitch-Dispenser", icon: "https://images.hive.blog/u/cadawg/avatar"}],
        name: "URL Encode",
    },
    {
        testAndAnswer: (q) => {
            const decoded = decodeURIComponent(q);
            if (q.indexOf(" ") === -1 && decoded !== q) {
                return {test: true, answer: [decoded, `URL Decode: ${q}`]};
            } else {
                return {test: false, answer: null}
            }
        },
        authors: [{name: "Conor", url: "https://github.com/Snaddyvitch-Dispenser", icon: "https://images.hive.blog/u/cadawg/avatar"}],
        name: "URL Decode",
    }
];

async function getQuickAnswer(query) {
    for (let i = 0; i < quickAnswers.length; i++) {
        const qa = quickAnswers[i];

        if (Object.hasOwn(qa, "testAndAnswer")) {
            const tAndA = await qa.testAndAnswer(query);

            if (tAndA.test === true && tAndA.answer !== null) {
                return {
                    name: qa.name,
                    authors: qa.authors,
                    answer: tAndA.answer
                }
            }
        } else {
            if (await qa.test(query) === true) {
                const ans = await qa.answer(query);
                if (ans !== null) {
                    return {
                        name: qa.name,
                        authors: qa.authors,
                        answer: ans
                    }
                }
            }
        }
    }

    return null;
}

(function() {
    'use strict';

    window.addEventListener("load", async function() {
        // get query
        const q = (new URLSearchParams(window.location.search)).get("q");

        const ans = await getQuickAnswer(q);

        if (ans === null) return; // no answer to give

        const savedVersion = window.localStorage.getItem("instantAnswerVersion");
        const iAD = window.localStorage.getItem("instantAnswerDetail");
        const div = document.createElement("div");
        div.innerHTML = iAD;
        if (iAD && document.querySelector("[class*=result-group-container__component]").className == iAD.split('"')[1] && savedVersion === version) {
            console.log("QuickAnswers: Using existing container");
            const child = div.querySelector("[data-docid*='0x']")

            const title = child.querySelector("[class*=lib-doc-title__link]");

            title.innerText = ans.answer[0];

            const snippet = child.querySelector("[class*=lib-doc-snippet__component]");

            snippet.innerText = ans.answer[1];

            const firstAnswer = document.querySelector("[class*=result-group-container__component]");
            const parent = firstAnswer.parentElement;

            parent.prepend(div);
        } else {
            console.log("QuickAnswers: Creating new container")
            const firstAnswer = document.querySelector("[class*=result-group-container__component]");
            const parent = firstAnswer.parentElement;

            const clone = firstAnswer.cloneNode(true);

            const children = clone.querySelectorAll("[data-docid*='0x']")

            let firstChild = children[0];

            for (let i = 1; i < children.length; i++) {
                children[i].remove()
            }

            firstChild.querySelector("[class*=web-index__firstLine]").remove();

            firstChild.querySelector("[class*=web-index__displayURL]").remove();

            const title = firstChild.querySelector("[class*=lib-doc-title__link]");

            title.innerText = ans.answer[0];
            title.style = "pointer-events: none; color: white; text-decoration: none; -webkit-line-clamp: unset; line-clamp: unset;"

            title.parentElement.style = "cursor: default; word-wrap: break-word; -webkit-line-clamp: unset; line-clamp: unset; overflow: visible;"

            const snippet = firstChild.querySelector("[class*=lib-doc-snippet__component]");

            snippet.innerText = ans.answer[1];

            window.localStorage.setItem("instantAnswerDetail", clone.outerHTML);
            window.localStorage.setItem("instantAnswerVersion", version);

            parent.prepend(clone);
        }
    });
})();
