const express = require('express');
const oracledb = require('oracledb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Uses port 3000 for web server

app.use(express.json());

app.use(express.static(path.join(__dirname, '../client')));

// Initializes the database for use
async function initialize() {
    try {
        await oracledb.createPool({
            user: 'admindba', // Change to your local username
            password: 'password', // Change to your local password
            connectionString: 'localhost/XEPDB1' // Change to your local connection
        });
        console.log('Connected to Oracle database');
    } catch (err) {
        console.error('Error connecting to Oracle database:', err);
    }
}

// Gets all of the books in the books table
app.get('/api/books', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('select b.Title, a.AuthorName, b.Publisher, b.Year, b.Genre, b.CopiesAvailable, b.cover from Books b, Author a where a.authorid = b.authorid');

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection', err);
            }
        }
    }
});


// Adds a book to the books table
app.post('/api/addBook', async (req, res) => {
    const { bookId, title, author, publisher, year, genre, copiesAvailable, cover } = req.body;

    // Normalize numeric values in case Open Library sends non-digit year strings (e.g. "February 2011")
    const parseYearValue = (text) => {
        if (text == null) return null;
        const textStr = String(text).trim();
        if (textStr === '') return null;
        const found = textStr.match(/\d{4}/);
        if (found) {
            const asNumber = Number(found[0]);
            return Number.isNaN(asNumber) ? null : asNumber;
        }
        const asNumber = Number(textStr);
        return Number.isNaN(asNumber) ? null : asNumber;
    };

    const parsedYear = parseYearValue(year);
    const parsedBookId = (() => {
        if (bookId == null) return null;
        const trimmed = String(bookId).trim();
        if (trimmed === '') return null;
        const asNumber = Number(trimmed);
        return Number.isNaN(asNumber) ? null : asNumber;
    })();
    const parsedCopiesAvailable = (() => {
        const value = copiesAvailable == null ? null : Number(copiesAvailable);
        return Number.isNaN(value) ? 0 : value;
    })();

    let connection;
    try {
        connection = await oracledb.getConnection();

        const query = `
            BEGIN addBook(:bookId, :title, :author, :publisher, :year, :genre, :copiesAvailable, :cover); END;
        `;

        await connection.execute(query, {
            bookId: parsedBookId,
            title: title || null,
            author: author || null,
            publisher: publisher || null,
            year: parsedYear,
            genre: genre || null,
            copiesAvailable: parsedCopiesAvailable,
            cover: cover || null
        });
        await connection.commit();

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding book:', error, {
            bookId: parsedBookId,
            title,
            author,
            publisher,
            year,
            parsedYear,
            genre,
            copiesAvailable,
            cover
        });
        res.json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});


// Adds a member to the member table
app.post('/api/addMember', async (req, res) => {
    const { MemberName, MemberAddress, MemberPhone, MemberEmail, MemberPassword} = req.body;


    let connection;
    try {
        connection = await oracledb.getConnection();


        const query = `
            BEGIN AddMember(:MemberName, :MemberAddress, :MemberPhone, :MemberEmail, :MemberPassword); END;
        `;

        await connection.execute(query, {
            MemberName: MemberName,
            MemberAddress: MemberAddress || null,
            MemberPhone: MemberPhone || null,
            MemberEmail: MemberEmail || null,
            MemberPassword: MemberPassword || null,

        });

        await connection.commit();

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding member:', error, {
            MemberName,
            MemberAddress,
            MemberPhone,
            MemberEmail,
            MemberPassword,
        });
        res.json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});


// Checks to see if the member's email and password provided return at least 1 result, if so it returns the email provided
app.post('/api/memberLogin', async (req, res) => {
    const { email, password } = req.body;

    try {
    const connection = await oracledb.getConnection();

    const result = await connection.execute(
        `SELECT * FROM members WHERE MEMBEREMAIL = :email AND MEMBERPASSWORD = :password`,
        { email: email, password: password }
    );

    if (result.rows.length > 0) {
        res.json({ message: email});
    } else {
        res.json({ message: 'Invalid email or password' });
    }

    await connection.close();
    } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
    }
});


// Checks to see if the staff's email and password match at least 1 result, if so it returns the email provided
app.post('/api/staffLogin', async (req, res) => {
    const { email, password } = req.body;

    try {
    const connection = await oracledb.getConnection();

    const result = await connection.execute(
        `SELECT * FROM staff WHERE STAFFEMAIL = :email AND STAFFPASSWORD = :password`,
        { email: email, password: password }
    );

    if (result.rows.length > 0) {
        res.json({ message: email });
    } else {
        res.json({ message: 'Invalid email or password' });
    }

    await connection.close();
    } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
    }
});


// Returns all members that match the provided email address
app.get('/api/members', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email query parameter is required' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            'SELECT * FROM members WHERE MEMBEREMAIL = :email',
            { email }
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection', err);
            }
        }
    }
});


// Returns all staff that match the email provided
app.get('/api/staff', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email query parameter is required' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            'SELECT * FROM staff WHERE STAFFEMAIL = :email',
            { email }
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection', err);
            }
        }
    }
});


// Returns all loans from a certain member based on memberid
app.get('/api/loans', async (req, res) => {
    const { memberID } = req.query;

    if (!memberID) {
        return res.status(400).json({ error: 'memberID query parameter is required' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            'SELECT * FROM loans WHERE MEMBERID = :memberID',
            { memberID }
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection', err);
            }
        }
    }
});


// Returns the merging of books and loans tables
app.get('/api/memberloans', async (req, res) => {
    const { memberID, bookID } = req.query;

    if (!memberID) {
        return res.status(400).json({ error: 'memberID query parameter is required' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        const query = bookID
            ? 'SELECT b.TITLE, l.ISSUEDATE, l.DUEDATE FROM loans l JOIN BOOKS b ON l.BOOKID = b.BOOKID WHERE l.MEMBERID = :memberID AND b.BOOKID = :bookID'
            : 'SELECT b.TITLE, l.ISSUEDATE, l.DUEDATE FROM loans l JOIN BOOKS b ON l.BOOKID = b.BOOKID WHERE l.MEMBERID = :memberID';

        const binds = bookID ? { memberID, bookID } : { memberID };

        const result = await connection.execute(query, binds);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection', err);
            }
        }
    }
});


// Adds the bookid, staffid, and memberid to a entry in the loans table, which makes the book checked out
app.post('/api/checkOutBook', async (req, res) => {
    const { BookID, StaffID, MemberID } = req.body;


    let connection;
    try {
        connection = await oracledb.getConnection();

        await connection.execute(
            `BEGIN
                CheckOutBook(:BookID, :StaffID, :MemberID);
            END;`,
            { BookID: BookID, StaffID: StaffID, MemberID: MemberID }
        );

        await connection.commit();

        res.json({ success: true });
    } catch (error) {
        console.error('Error checking out book:', error, {
            BookID,
            StaffID,
            MemberID,
        });
        res.json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

// Adds the bookid, staffid, and memberid to a entry in the loans table, which makes the book checked out
app.post('/api/returnBook', async (req, res) => {
    const { BookID, StaffID, MemberID } = req.body;


    let connection;
    try {
        connection = await oracledb.getConnection();

        await connection.execute(
            `BEGIN
                ReturnBook(:BookID, :StaffID, :MemberID);
            END;`,
            { BookID: BookID, StaffID: StaffID, MemberID: MemberID }
        );

        await connection.commit();

        res.json({ success: true });
    } catch (error) {
        console.error('Error checking out book:', error, {
            BookID,
            StaffID,
            MemberID,
        });
        res.json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});


app.listen(PORT, () => {
    initialize(); 
    console.log(`Server is running on http://localhost:${PORT}`);
});