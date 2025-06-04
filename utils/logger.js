// utils/logger.js
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
};

const colors = {
    // Màu chữ sáng (bright)
    yellowBright: (text) => `\x1b[93m${text}\x1b[0m`,
    redBright: (text) => `\x1b[91m${text}\x1b[0m`,
    greenBright: (text) => `\x1b[92m${text}\x1b[0m`,
    blueBright: (text) => `\x1b[94m${text}\x1b[0m`,
    whiteBright: (text) => `\x1b[97m${text}\x1b[0m`,
    
    // Màu nền siêu nhạt (bright background)
    bgYellowLight: (text) => `\x1b[103;97m${text}\x1b[0m`, // Màu nền vàng nhạt với chữ trắng sáng
    bgRedLight: (text) => `\x1b[101;97m${text}\x1b[0m`,
    bgGreenLight: (text) => `\x1b[102;97m${text}\x1b[0m`,
    bgBlueLight: (text) => `\x1b[104;97m${text}\x1b[0m`,
    
    // Kết hợp màu siêu nhạt (chữ vàng sáng trên nền vàng nhạt)
    superLight: (text) => `\x1b[103;93m${text}\x1b[0m`,
    
    // Định dạng
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    italic: (text) => `\x1b[3m${text}\x1b[0m`,
    underline: (text) => `\x1b[4m${text}\x1b[0m`,
    reset: '\x1b[0m',
};

// Hàm để ghi đè các hàm console
const setupColoredConsole = () => {
    // Ghi đè console.log
    console.log = (...args) => {
        const coloredArgs = args.map(arg => {
            // Kiểm tra nếu là chuỗi, số, boolean thì áp dụng màu
            if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
                return colors.bold(arg.toString()); // Sử dụng bold cho console.log mặc định
            } 
            // Nếu là đối tượng (bao gồm mảng và JSON), chuyển đổi thành chuỗi JSON đẹp
            else if (typeof arg === 'object' && arg !== null) {
                // JSON.stringify(arg, null, 2) để định dạng JSON dễ đọc
                return colors.bold(JSON.stringify(arg, null, 2)); 
            }
            // Trả về nguyên bản cho các kiểu dữ liệu khác (ví dụ: undefined, null, function)
            return arg;
        });
        originalConsole.log(...coloredArgs);
    };

    // Ghi đè console.warn
    console.warn = (...args) => {
        const coloredArgs = args.map(arg => {
            if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
                return colors.bgYellowLight(arg.toString());
            } 
            else if (typeof arg === 'object' && arg !== null) {
                return colors.bgYellowLight(JSON.stringify(arg, null, 2));
            }
            return arg;
        });
        originalConsole.warn(...coloredArgs);
    };

    // Ghi đè console.error
    console.error = (...args) => {
        const coloredArgs = args.map(arg => {
            if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
                return colors.bgRedLight(arg.toString());
            } 
            else if (typeof arg === 'object' && arg !== null) {
                return colors.bgRedLight(JSON.stringify(arg, null, 2));
            }
            return arg;
        });
        originalConsole.error(...coloredArgs);
    };
};

module.exports = {
    setupColoredConsole,
    colors
};