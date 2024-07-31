function getCookieOptions() {
    return {
        maxAge: 1000 * 60 * 60,
        secure: true,
        signed: true,
        sameSite: "strict",
        httpOnly: false,
        partitioned: true,
    };
}

module.exports = {getCookieOptions};
