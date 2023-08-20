const tailwindClasses = [
    "text-center",
    "bg-blue-500",
    "py-4",
    "hover:bg-blue-700",
    // Dodaj więcej klas Tailwind CSS do konwersji
];

let scssOutput = "";

tailwindClasses.forEach((twClass) => {
    const parts = twClass.split("-");
    
    let scssClass = "";
    parts.forEach((part) => {
        if (!isNaN(part)) {
            scssClass += part;
        } else {
            scssClass += `_${part}`;
        }
    });
    
    scssOutput += `.${scssClass} { @extend .${twClass}; }\n`;
});

console.log(scssOutput);