const fs = require('fs');
const path = require('path');

// Mock DOM and Browser Environment
global.document = {
    getElementById: (id) => {
        if (!global.mockElements[id]) {
            global.mockElements[id] = { value: '', innerHTML: '' };
        }
        return global.mockElements[id];
    },
    addEventListener: () => { },
    createElement: () => ({ click: () => { }, href: '' }),
    body: { appendChild: () => { }, removeChild: () => { } }
};

global.alert = (msg) => { console.log("ALERT:", msg); };
global.console = { ...console, error: console.error }; // Keep console structure

// Mock LocalStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => store[key] = value.toString(),
        clear: () => store = {}
    };
})();
global.localStorage = localStorageMock;

// Mock Fetch
global.fetch = async (file) => {
    if (file === "base_datos.csv") {
        const content = fs.readFileSync(path.join(__dirname, 'base_datos.csv'), 'utf8');
        return {
            text: async () => content
        };
    }
    throw new Error("404 Not Found");
};

// Global Store for Mock Elements
global.mockElements = {};

// Load script.js content (eval it to bring functions into scope)
const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
eval(scriptContent);

// Test Suite
async function runTests() {
    console.log("--- Starting Verification ---");

    // Wait for fetch to complete (it's immediate in mock but promise-based in code)
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log("Database Loadded. Size:", baseDatos.length);

    // Test 1: Search Valid DNI (No leading zero)
    console.log("\nTest 1: Search '10667253'");
    let input = document.getElementById("codigo");
    input.value = "10667253";
    buscar();
    let result = document.getElementById("resultado").innerHTML;
    if (result.includes("Carrillo Larez")) {
        console.log("PASS: Found 'Carrillo Larez'");
    } else {
        console.log("FAIL: Expected 'Carrillo Larez', got:", result);
    }
    if (result.includes("uc?export=download")) {
        console.log("PASS: Download link generated");
    } else {
        console.log("FAIL: Download link not generated correctly");
    }

    // Test 2: Search Valid DNI (With leading zero)
    console.log("\nTest 2: Search '0145424066'");
    input.value = "0145424066";
    buscar();
    result = document.getElementById("resultado").innerHTML;
    if (result.includes("Perez Cairo")) {
        console.log("PASS: Found 'Perez Cairo'");
    } else {
        console.log("FAIL: Expected 'Perez Cairo', got:", result);
    }

    // Test 3: Search Invalid DNI
    console.log("\nTest 3: Search '99999999'");
    input.value = "99999999";
    buscar();
    result = document.getElementById("resultado").innerHTML;
    if (result.includes("no encontrado")) {
        console.log("PASS: Correctly showed 'no encontrado'");
    } else {
        console.log("FAIL: Expected 'no encontrado', got:", result);
    }

    // Test 4: Rate Limiting
    console.log("\nTest 4: Rate Limiting (Max 3/min)");
    localStorage.clear();

    // Download 1
    console.log("Attempt 1:");
    descargarPDF("http://example.com/1");

    // Download 2
    console.log("Attempt 2:");
    descargarPDF("http://example.com/2");

    // Download 3
    console.log("Attempt 3:");
    descargarPDF("http://example.com/3");

    // Download 4 (Should Fail)
    console.log("Attempt 4 (Should trigger Alert):");
    descargarPDF("http://example.com/4");

    const history = JSON.parse(localStorage.getItem('historialDescargas'));
    if (history.length === 3) {
        console.log("PASS: History stuck at 3 items");
    } else {
        console.log(`FAIL: History has ${history.length} items`);
    }

    console.log("--- Verification Complete ---");
}

runTests();
