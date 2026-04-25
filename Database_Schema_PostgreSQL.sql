-- PostgreSQL Schema for Azeroth Library
-- Converted from Oracle Database

-- REMOVE ALL TABLES START
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
-- REMOVE ALL TABLES END

-- CREATE ALL TABLES START
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    author_name VARCHAR(100),
    author_bio VARCHAR(4000)
);

CREATE TABLE members (
    member_id SERIAL PRIMARY KEY,
    member_name VARCHAR(100) NOT NULL,
    member_address VARCHAR(200),
    member_phone VARCHAR(15),
    member_email VARCHAR(100),
    member_password VARCHAR(20) DEFAULT 'password'
);

CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    staff_name VARCHAR(100),
    staff_role VARCHAR(20),
    staff_phone VARCHAR(15),
    staff_email VARCHAR(100),
    hire_date DATE,
    staff_password VARCHAR(20) DEFAULT 'password'
);

CREATE TABLE books (
    book_id BIGINT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    author_id INTEGER REFERENCES authors(author_id),
    publisher VARCHAR(100),
    year INTEGER,
    genre VARCHAR(100),
    copies_available INTEGER,
    cover VARCHAR(500)
);

CREATE TABLE loans (
    loan_id SERIAL PRIMARY KEY,
    book_id BIGINT REFERENCES books(book_id),
    member_id INTEGER REFERENCES members(member_id),
    staff_id INTEGER REFERENCES staff(staff_id),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    return_date DATE
);

CREATE TABLE fines (
    fine_id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(loan_id),
    member_id INTEGER REFERENCES members(member_id),
    staff_id INTEGER REFERENCES staff(staff_id),
    amount_due NUMERIC(8,2),
    amount_paid NUMERIC(8,2),
    payment_date DATE
);
-- CREATE ALL TABLES END

-- CREATE ALL FUNCTIONS START

-- Function that adds the author and book to the database
CREATE OR REPLACE FUNCTION add_book (
    p_book_id BIGINT,
    p_title VARCHAR,
    p_author VARCHAR,
    p_publisher VARCHAR,
    p_year INTEGER,
    p_genre VARCHAR,
    p_copies INTEGER,
    p_cover VARCHAR
)
RETURNS void AS $$
DECLARE
    v_author_id INTEGER;
BEGIN
    -- Looks to see if the author is already in the table
    SELECT author_id INTO v_author_id
    FROM authors
    WHERE author_name = p_author;
    
    -- If author doesn't exist, insert one
    IF NOT FOUND THEN
        INSERT INTO authors(author_name, author_bio)
        VALUES (p_author, null)
        RETURNING author_id INTO v_author_id;
    END IF;
    
    -- Adds book to table
    INSERT INTO books(book_id, title, author_id, publisher, year, genre, copies_available, cover)
    VALUES (p_book_id, p_title, v_author_id, p_publisher, p_year, p_genre, p_copies, p_cover);
END;
$$ LANGUAGE plpgsql;

-- Function that adds a member to the database
CREATE OR REPLACE FUNCTION add_member (
    p_member_name VARCHAR,
    p_member_address VARCHAR,
    p_member_phone VARCHAR,
    p_member_email VARCHAR,
    p_member_password VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO members(member_name, member_address, member_phone, member_email, member_password)
    VALUES (p_member_name, p_member_address, p_member_phone, p_member_email, COALESCE(p_member_password, 'password'));
END;
$$ LANGUAGE plpgsql;

-- Function that adds staff to the database
CREATE OR REPLACE FUNCTION add_staff (
    p_staff_name VARCHAR,
    p_staff_role VARCHAR,
    p_staff_phone VARCHAR,
    p_staff_email VARCHAR,
    p_hire_date DATE,
    p_staff_password VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO staff(staff_name, staff_role, staff_phone, staff_email, hire_date, staff_password)
    VALUES (p_staff_name, p_staff_role, p_staff_phone, p_staff_email, p_hire_date, COALESCE(p_staff_password, 'password'));
END;
$$ LANGUAGE plpgsql;

-- Function that checks out a book for a member
CREATE OR REPLACE FUNCTION checkout_book (
    p_book_id BIGINT,
    p_staff_id INTEGER,
    p_member_id INTEGER
)
RETURNS void AS $$
BEGIN
    INSERT INTO loans(book_id, member_id, staff_id, issue_date)
    VALUES (p_book_id, p_member_id, p_staff_id, CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function that returns a book
CREATE OR REPLACE FUNCTION return_book (
    p_book_id BIGINT,
    p_staff_id INTEGER,
    p_member_id INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE loans
    SET return_date = CURRENT_DATE
    WHERE book_id = p_book_id AND member_id = p_member_id AND return_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- CREATE ALL FUNCTIONS END

-- CREATE ALL TRIGGERS START

-- Trigger to set due date (14 days after issue date)
CREATE OR REPLACE FUNCTION set_due_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.due_date := NEW.issue_date + INTERVAL '14 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_due_date
BEFORE INSERT ON loans
FOR EACH ROW
EXECUTE FUNCTION set_due_date();

-- Trigger to update copies available when a book is checked out or returned
CREATE OR REPLACE FUNCTION update_copies_available()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
        -- Book is being returned
        UPDATE books
        SET copies_available = copies_available + 1
        WHERE book_id = NEW.book_id;
    ELSIF OLD.return_date IS NULL AND NEW.return_date IS NULL THEN
        -- Book is being checked out (new loan record)
        UPDATE books
        SET copies_available = copies_available - 1
        WHERE book_id = NEW.book_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_copies_available
AFTER INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_copies_available();

-- CREATE ALL TRIGGERS END

-- Add test values to the books, author, and members tables
SELECT add_book(9781526641168, 'A Court of Thorns and Roses', 'Sarah J. Maas', 'Bloomsbury', 2015, 'Fantasy', 4, 'https://covers.openlibrary.org/b/id/13774033-L.jpg');
SELECT add_book(140328726, 'Fantastic Mr. Fox', 'Roald Dahl', 'Puffin', 1988, 'Animals', 3, 'https://covers.openlibrary.org/b/id/15152634-L.jpg');
SELECT add_book(9780593135204, 'Project Hail Mary', 'Andy Weir', 'Ballantine Books', 2021, 'hard science-fiction', 2, 'https://covers.openlibrary.org/b/id/12455001-L.jpg');

-- Add test members
SELECT add_member('Justin Snyder', '333 SQL Lane', '5555555555', 'jsnyder@test.com');
SELECT add_member('Darth Vader', '444 Death Star', '3333333333', 'dvader@test.com');
SELECT add_member('Sylvanas Windrunner', '222 Winderunner Spire', '1234567899', 'swindrunner@test.com');

-- Add test staff
SELECT add_staff('Debbie Grayson', 'Admin', '9876543211', 'dgrayson@test.com', CURRENT_DATE);
SELECT add_staff('Samantha Eve Wilkins', 'Librarian', '9999999999', 'swilkins@test.com', CURRENT_DATE);
SELECT add_staff('Mark Grayson', 'Security Guard', '8888888888', 'mgrayson@test.com', CURRENT_DATE);

-- Tests for checking out books to members
-- SELECT checkout_book(9780593135204, 1, 1);  -- Debbie checks out 'Project Hail Mary' to Justin
-- SELECT checkout_book(9781526641168, 2, 3);  -- Samantha checks out 'A Court of Thorns and Roses' to Sylvanas
