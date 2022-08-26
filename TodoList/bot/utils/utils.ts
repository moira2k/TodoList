function convertInt2String(timeInt: number) {
    var res: string;
    if (timeInt < 10) {
        res = "0" + timeInt;
    } else {
        res = timeInt.toString();
    }
    return res;
}

function getTimezone(time: Date) {
    const bias = Math.abs(time.getTimezoneOffset() / 60);
    var timezone: string = convertInt2String(bias) + ":00";

    if (bias == 0) {
        timezone = "Z";
    } else if (bias > 0) {
        timezone = "+" + timezone;
    } else {
        timezone = "-" + timezone;
    }
    
    return timezone;
}

export function convertTimeString(time: Date) {
    /**
     * Adaptive Cards offers DATE() and TIME() formatting functions to automatically localize the time on the target device.
     * Date/Time function rules: 1.CASE SENSITIVE, 2.NO SPACES, 3.STRICT RFC 3389 FORMATTING, 4.MUST BE a valid date and time
     * Valid formats:
     * 2017-02-14T06:08:00Z
     * 2017-02-14T06:08:00-07:00
     * 2017-02-14T06:08:00+07:00
     */

    var res: string;
    const year = time.getFullYear();
    const month = convertInt2String(time.getMonth() + 1);
    const date = convertInt2String(time.getDate());
    const hour = convertInt2String(time.getHours());
    const minute = convertInt2String(time.getMinutes());
    const second = convertInt2String(time.getSeconds());
    res = `${year}-${month}-${date}T${hour}:${minute}:${second}${getTimezone(time)}`;

    return res;
}

export function repalceHtmlToText(str: string) {
    str = str.replace(/<\/?.+?>/g, "");
    str = str.replace(/&nbsp;/g, "");
    return str;
}
