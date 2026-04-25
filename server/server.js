import express from 'express';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000; // Uses port 3000 for web server

app.use(express.json());

app.use(express.static(path.join(__dirname, '../client')));

// PostgreSQL connection using environment variable
const sql = postgres(process.env.DATABASE_URL);

// Initializes the database for use
async function initialize() {
    try {
        await sql`SELECT NOW()`;
        console.log('Connected to PostgreSQL database');
    } catch (err) {
        console.error('Error connecting to PostgreSQL database:', err);
    }
}

// Gets all of the books in the books table
app.get('/api/books', async (req, res) => {
    try {
        const result = await sql`SELECT b.title, a.author_name, b.publisher, b.year, b.genre, b.copies_available, b.cover FROM books b JOIN authors a ON a.author_id = b.author_id`;

        res.json(result);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
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

    try {
        // Call PostgreSQL function: SELECT add_book(...)
        await sql`SELECT add_book(${parsedBookId}, ${title || null}, ${author || null}, ${publisher || null}, ${parsedYear}, ${genre || null}, ${parsedCopiesAvailable}, ${cover || null})`;

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
    }
});


// Adds a member to the member table
app.post('/api/addMember', async (req, res) => {
    const { MemberName, MemberAddress, MemberPhone, MemberEmail, MemberPassword } = req.body;

    try {
        // Call PostgreSQL function: SELECT add_member(...)
        await sql`SELECT add_member(${MemberName}, ${MemberAddress || null}, ${MemberPhone || null}, ${MemberEmail || null}, ${MemberPassword || null})`;

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
    }
});


// Checks to see if the member's email and password provided return at least 1 result, if so it returns the email provided
app.post('/api/memberLogin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await sql`SELECT * FROM members WHERE member_email = ${email} AND member_password = ${password}`;

        if (result.length > 0) {
            res.json({ message: email });
        } else {
            res.json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// Checks to see if the staff's email and password match at least 1 result, if so it returns the email provided
app.post('/api/staffLogin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await sql`SELECT * FROM staff WHERE staff_email = ${email} AND staff_password = ${password}`;

        if (result.length > 0) {
            res.json({ message: email });
        } else {
            res.json({ message: 'Invalid email or password' });
        }
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

    try {
        const result = await sql`SELECT * FROM members WHERE member_email = ${email}`;

        res.json(result);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});


// Returns all staff that match the email provided
app.get('/api/staff', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email query parameter is required' });
    }

    try {
        const result = await sql`SELECT * FROM staff WHERE staff_email = ${email}`;

        res.json(result);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});


// Returns all loans from a certain member based on memberid
app.get('/api/loans', async (req, res) => {
    const { memberID } = req.query;

    if (!memberID) {
        return res.status(400).json({ error: 'memberID query parameter is required' });
    }

    try {
        const result = await sql`SELECT * FROM loans WHERE member_id = ${memberID}`;

        res.json(result);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});


// Returns the merging of books and loans tables
app.get('/api/memberloans', async (req, res) => {
    const { memberID, bookID } = req.query;

    if (!memberID) {
        return res.status(400).json({ error: 'memberID query parameter is required' });
    }

    try {
        let result;
        
        if (bookID) {
            result = await sql`SELECT b.title, l.issue_date, l.due_date FROM loans l JOIN books b ON l.book_id = b.book_id WHERE l.member_id = ${memberID} AND b.book_id = ${bookID}`;
        } else {
            result = await sql`SELECT b.title, l.issue_date, l.due_date FROM loans l JOIN books b ON l.book_id = b.book_id WHERE l.member_id = ${memberID}`;
        }

        res.json(result);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});


// Adds the bookid, staffid, and memberid to a entry in the loans table, which makes the book checked out
app.post('/api/checkOutBook', async (req, res) => {
    const { BookID, StaffID, MemberID } = req.body;

    try {
        // Call PostgreSQL function: SELECT checkout_book(...)
        // Convert BookID and MemberID to proper types
        await sql`SELECT checkout_book(${BigInt(BookID)}, ${parseInt(StaffID)}, ${parseInt(MemberID)})`;

        res.json({ success: true });
    } catch (error) {
        console.error('Error checking out book:', error, {
            BookID,
            StaffID,
            MemberID,
        });
        res.json({ success: false });
    }
});

// Returns a book from a member in the loans table
app.post('/api/returnBook', async (req, res) => {
    const { BookID, StaffID, MemberID } = req.body;
    
    try {
        // Call PostgreSQL function: SELECT return_book(...)
        // Convert BookID and MemberID to proper types
        await sql`SELECT return_book(${BigInt(BookID)}, ${parseInt(StaffID)}, ${parseInt(MemberID)})`;

        res.json({ success: true });
    } catch (error) {
        console.error('Error returning book:', error, {
            BookID,
            StaffID,
            MemberID,
        });
        res.json({ success: false });
    }
});


app.listen(PORT, () => {
    initialize(); 
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;