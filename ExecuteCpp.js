const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const outputPath = path.join(__dirname, "output");
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeCode = (filePath, input = "", language) => {
  const jobId = path.basename(filePath).split(".")[0];
  const dirPath = path.dirname(filePath);
  const ext = path.extname(filePath);

  return new Promise((resolve, reject) => {
    let command;

    switch (language.toLowerCase()) {
      case "cpp": {
        const outputFilePath = path.join(outputPath, `${jobId}.out`);
        command = `g++ ${filePath} -o ${outputFilePath} && ${outputFilePath}`;
        break;
      }

      case "python":
        // command = `python3 ${filePath}`;
        command = `python ${filePath}`;

        break;

      case "java": {
        const javaFileName = path.basename(filePath);
        const className = "Main";

        // Java must be in Main.java
        const mainJavaPath = path.join(dirPath, "Main.java");
        fs.copyFileSync(filePath, mainJavaPath); // Rename to Main.java
        command = `javac ${mainJavaPath} && java -cp ${dirPath} ${className}`;
        break;
      }

      default:
        return reject("Unsupported language");
    }

    const runProcess = exec(command, { cwd: outputPath });

    let result = "";

    runProcess.stdin.write(input);
    runProcess.stdin.end();

    runProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    runProcess.stderr.on("data", (data) => {
      return reject(data.toString());
    });

    runProcess.on("close", (code) => {
      try {
        // Cleanup
        fs.unlinkSync(filePath);
        if (language === "cpp") {
          const compiled = path.join(outputPath, `${jobId}.out`);
          if (fs.existsSync(compiled)) fs.unlinkSync(compiled);
        }

        if (language === "java") {
          const mainJava = path.join(dirPath, "Main.java");
          const mainClass = path.join(dirPath, "Main.class");
          if (fs.existsSync(mainJava)) fs.unlinkSync(mainJava);
          if (fs.existsSync(mainClass)) fs.unlinkSync(mainClass);
        }
      } catch (e) {
        console.warn("Cleanup failed:", e);
      }

      resolve(result);
    });
  });
};

module.exports = {
  executeCode,
};
