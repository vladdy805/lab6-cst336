import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));

//setting up database connection pool
const pool = mysql.createPool({
    host: "yhrz9vns005e0734.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "xavr1nbglty65ybz",
    password: "ymuw3zp1w66gt40q",
    database: "s1rgnvg5za0kgrsf",
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', (req, res) => {
    res.render('index')
});

app.get('/author/new', (req, res) => {
    res.render("newAuthor");
})

app.post("/author/new", async function (req, res) {
    let fName = req.body.fName;
    let lName = req.body.lName;
    let birthDate = req.body.birthDate;
    let deathDate = req.body.deathDate;
    let sex = req.body.sex;
    let profession = req.body.profession;
    let country = req.body.country;
    let portraitUrl = req.body.portraitUrl;
    let biography = req.body.biography;
    let sql = `INSERT INTO q_authors
             (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let params = [fName, lName, birthDate, deathDate, sex, profession, country, portraitUrl, biography];
    const [rows] = await pool.query(sql, params);
    res.render("newAuthor",
        { "message": "Author added!" });
});

app.get("/authors", async function (req, res) {
    let sql = `SELECT *
            FROM q_authors
            ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    res.render("authorList", { "authors": rows});
});

app.get("/quotes", async function (req, res) {
    let sql = `SELECT DISTINCT *
            FROM q_quotes
            NATURAL JOIN q_authors
            ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    res.render("quoteList", {"quotes": rows});
})

app.get("/author/edit", async function (req, res) {
    let authorId = req.query.authorId;

    let sql = `SELECT *, 
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO, DATE_FORMAT(dod, '%Y-%m-%d') dodISO
        FROM q_authors
        WHERE authorId =  ${authorId}`;
    const [rows] = await pool.query(sql);
    res.render("editAuthor", { "authorInfo": rows });
});

app.post("/author/edit", async function (req, res) {
    let sql = `UPDATE q_authors
            SET firstName = ?,
                lastName = ?,
                dob = ?,
                dod = ?,
                sex = ?,
                profession = ?,
                country = ?,
                portrait = ?,
                biography = ?
            WHERE authorId =  ?`;

    let params = [req.body.fName,
    req.body.lName, req.body.dob, req.body.dod,
    req.body.sex, req.body.profession, req.body.country,
    req.body.portrait, req.body.biography, req.body.authorId];
    const [rows] = await pool.query(sql, params);
    res.redirect("/authors");
});

app.get("/author/delete", async function (req, res) {
    let authorId = req.query.authorId;
    let sql = `DELETE
            FROM q_authors
            WHERE authorId = ?`;
    const [rows] = await pool.query(sql, [authorId]);
    res.redirect("/authors");
});

app.get("/quote/new", async function (req, res) {
    let sqlAuthors = `SELECT authorId, firstName, lastName
            FROM q_authors
            ORDER BY lastName`;
    let sqlCategory = `SELECT DISTINCT category
            FROM q_quotes
            ORDER BY category`;
    const [authorRows] = await pool.query(sqlAuthors);
    const [categoryRows] = await pool.query(sqlCategory);
    res.render("newQuote", {authors: authorRows, categories: categoryRows});
});

app.post("/quote/new", async function (req, res) {
    let quote = req.body.quote;
    let authorId = req.body.authorId;
    let category = req.body.category;
    let sql = `INSERT INTO q_quotes
            (quote, authorId, category)
            VALUES (?, ?, ?)`;
    let params = [quote, authorId, category];
    const [rows] = await pool.query(sql, params);
    res.redirect("/quote/new");
});

app.get("/quote/edit", async function (req, res) {
    let quoteId = req.query.quoteId;
    let sql = `SELECT *
            FROM q_quotes
            NATURAL JOIN q_authors
            WHERE quoteId = ?`;
    let sqlAuthors = `SELECT authorId, firstName, lastName
            FROM q_authors
            ORDER BY lastName;`;
    let sqlCategory = `SELECT DISTINCT category
            FROM q_quotes
            ORDER BY category`;
    const [rows] = await pool.query(sql, [quoteId]);
    const [authorRows] = await pool.query(sqlAuthors);
    const [categoryRows] = await pool.query(sqlCategory);
    res.render("editQuote", {"quoteInfo": rows, authors: authorRows, categories: categoryRows});
});

app.post("/quote/edit", async function (req, res) {
    let sql = `UPDATE q_quotes
            SET quote = ?,
            authorId = ?,
            category = ?
            WHERE quoteId = ?`;
    let params = [req.body.quote, req.body.authorId, req.body.category, req.body.quoteId];
    const [rows] = await pool.query(sql, params);
    res.redirect("/quotes");
});

app.get("/quote/delete", async function (req, res) {
    let quoteId = req.query.quoteId;
    let sql = `DELETE
            FROM q_quotes
            WHERE quoteId = ?`;
    const [rows] = await pool.query(sql, [quoteId]);
    res.redirect("/quotes");
});

app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});//dbTest

app.listen(3000, () => {
    console.log("Express server running")
});