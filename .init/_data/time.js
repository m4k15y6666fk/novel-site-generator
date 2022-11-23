
module.exports = () => {
    let date = new Date();

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate()
    }
}
