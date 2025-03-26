export const formatDateToYYYYMMDDHHMM = (dateString: string | number | Date) => {
    const date = new Date(dateString);

    const jstDate = new Date(
        date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    );

    const year = jstDate.getFullYear();
    const month = String(jstDate.getMonth() + 1).padStart(2, "0");
    const day = String(jstDate.getDate()).padStart(2, "0");
    const hours = String(jstDate.getHours()).padStart(2, "0");
    const minutes = String(jstDate.getMinutes()).padStart(2, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export const formatDateToYYYYMMDD = (dateString: string | number | Date) => {
    const date = new Date(dateString);

    const jstDate = new Date(
        date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    );

    const year = jstDate.getFullYear();
    const month = String(jstDate.getMonth() + 1).padStart(2, "0");
    const day = String(jstDate.getDate()).padStart(2, "0");

    return `${year}/${month}/${day}`;
};
