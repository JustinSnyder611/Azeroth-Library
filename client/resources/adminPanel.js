const staffEmail = localStorage.getItem("staff")
let staffID = null

// Takes the staff email from the local storage and gets the staffid, title, and name of the staff member. Then inserts it into the staff page.
if (!staffEmail) {
    console.error('Staff email is not available in localStorage');
} else {
    fetch(`/api/staff?email=${encodeURIComponent(staffEmail)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const staffNameHeader = document.getElementById('staffNameHeader');

            data.forEach(staff => {
                console.log(staff)
                staffID = staff.staff_id
                staffNameHeader.textContent = `${staff.staff_role} ${staff.staff_name}`
            })
        })
        .catch(error => console.error('Error fetching staff:', error));
}


// Gets all book information from the open library api using the book's isbn number
async function fetchBookData(isbn) {
    const url = `https://openlibrary.org/api/books?&bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


// Once the book form is submited, this takes the isbn number, gets the book data, and sends it to the backend to be added to the books table
document.getElementById('bookForm').addEventListener('submit', function(event) {
    event.preventDefault();

    document.getElementById('loadingGif').style.display = "inline" // Display a loading gif while getting data

    let bookId = document.getElementById('bookId').value;
    let fixedBookId = "ISBN:" + bookId
    let randomNumber = Math.floor(Math.random() * 4) + 1;


    fetchBookData(bookId).then(data => {
        let title = data[fixedBookId]?.title ?? null; // Title of the book
        let author = data[fixedBookId]?.authors?.[0]?.name ?? null; // Author of the book
        let publisher = data[fixedBookId]?.publishers?.[0]?.name ?? null; // Publisher
        let year = data[fixedBookId]?.publish_date ?? null; // Publish Year
        let genre = data[fixedBookId]?.subjects?.[0]?.name ?? null; // Genre
        let copiesAvailable = randomNumber; // Copies of the book avaliable
        let cover = data[fixedBookId]?.cover?.large ?? null; //Cover of the book

        // If there is no title and author in the data then the book is not found
        if (title == null && author == null) {
            throw new Error("Book not found in API");
        }
        else if (cover == null) {
            throw new TypeError("reading 'large'")
        }

        return fetch('/api/addBook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bookId, title, author, publisher, year, genre, copiesAvailable, cover })
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('loadingGif').style.display = "none" // Stops the loading gif
            alert('Book added successfully!');
            location.reload();
        } else {
            document.getElementById('loadingGif').style.display = "none" // Stops the loading gif
            alert('Error adding book.');
        }
    })
    .catch((error) => {
        document.getElementById('loadingGif').style.display = "none"  // Stops the loading gif

        // Won't insert data if book has no cover
        if (error instanceof TypeError && error.message.includes("reading 'large'")) {
            alert("Book Missing Cover"); 
        }  
        // Won't insert data if there is no title and author
        else if (error instanceof Error && error.message.includes("Book not found in API")) {
            alert("Book not found in API"); 
        }
        else {
            console.error('Error fetching data:', error);
        }
    });
});


// Once the member form has been submited, this will get all of those values, and send them to the backend to be added to the members table
document.getElementById('memberForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    let memberName = document.getElementById('mName').value; // Member name
    let memberAddress = document.getElementById('mAdd').value; // Member residence address
    let memberPhone = document.getElementById('mPhone').value; // Member phone number
    let memberEmail = document.getElementById('mEmail').value; // Member email address
    let memberPassword = document.getElementById('mPass').value; // Member password

    fetch('/api/addMember', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ MemberName: memberName, MemberAddress: memberAddress, MemberPhone: memberPhone, MemberEmail: memberEmail, MemberPassword: memberPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Member added successfully!');
        } else {
            alert('Error adding member.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


// Once the loan form has been submited, this takes those values and sends them to the backend to be added to the loans table
document.getElementById('loanForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    let bookID = document.getElementById('bID').value; // Book ISBN
    let memberID = document.getElementById('mID').value; // Member ID

    fetch('/api/checkOutBook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ BookID: bookID, MemberID: memberID, StaffID: staffID })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Book checked out successfully!');
        } else {
            alert('Error checking out book.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// Once the return form has been submited, this takes those values and sends them to the backend to update the loans table
document.getElementById('returnForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    let bookID = document.getElementById('rbID').value; // Book ISBN
    let memberID = document.getElementById('rmID').value; // Member ID

    fetch('/api/returnBook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ BookID: bookID, MemberID: memberID, StaffID: staffID})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Book returned successfully!');
        } else {
            alert('Error returning book.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});