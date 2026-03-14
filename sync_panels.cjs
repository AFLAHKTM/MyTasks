const fs = require('fs');
const path = require('path');

const libDataPath = path.join(__dirname, 'src', 'lib', 'data.js');
let dataContent = fs.readFileSync(libDataPath, 'utf8');

// Add dispatch logic to data.js
if (!dataContent.includes('appDataChanged')) {
    dataContent = dataContent + `
export const dispatchDataUpdate = () => {
    window.dispatchEvent(new Event('appDataChanged'));
};
`;
    // Replace localStorage.setItem
    dataContent = dataContent.replace(/localStorage\.setItem\((.*?), JSON\.stringify\((.*?)\)\);/g, "localStorage.setItem($1, JSON.stringify($2));\n    dispatchDataUpdate();");
    fs.writeFileSync(libDataPath, dataContent);
    console.log("Updated data.js");
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Simple replace for common useEffect patterns
            if (content.includes('useEffect(() => {') && !content.includes('appDataChanged')) {
                // Find useEffects that call getTasks, getStatuses, etc.
                const useEffectRegex = /useEffect\(\(\) => \{([\s\S]*?(?:getTasks|getStatuses|getPriorities|getTask)[\s\S]*?)\}, \[(.*?)\]\);/g;
                content = content.replace(useEffectRegex, (match, body, deps) => {
                    if (body.includes('appDataChanged')) return match;

                    // We need to extract the fetch logic into a function inside the useEffect
                    const fetchFunc = `        const handleDataSync = () => {\n    ${body.trim().split('\n').join('\n    ')}\n        };\n        handleDataSync();\n        window.addEventListener('appDataChanged', handleDataSync);\n        window.addEventListener('storage', handleDataSync);`;

                    const newReturn = `        return () => {\n            window.removeEventListener('appDataChanged', handleDataSync);\n            window.removeEventListener('storage', handleDataSync);\n        };`;

                    return `useEffect(() => {
${fetchFunc}
${newReturn}
    }, [${deps}]);`;
                });

                if (content !== fs.readFileSync(fullPath, 'utf8')) {
                    fs.writeFileSync(fullPath, content);
                    console.log("Updated " + fullPath);
                    modified = true;
                }
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
