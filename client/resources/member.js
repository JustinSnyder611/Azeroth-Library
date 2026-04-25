const memberEmail = localStorage.getItem("member"); // Gets email from local storage
let memberID = null; // Default value for memberID
let bookID = null; // Default value for bookID

// Options for formating the return and due dates
const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZoneName: 'short' 
};



if (!memberEmail) {
    console.error('Member email is not available in localStorage');
} else {

    // Gets the member name and puts it on the page, also gets the member id and stores it in a variable
    fetch(`/api/members?email=${encodeURIComponent(memberEmail)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No member data returned');
            }

            const memberNameHeader = document.getElementById('memberNameHeader');
            const member = data[0];
            memberID = member.member_id;
            memberNameHeader.textContent = `${member.member_name}'s Account`;


            // Uses the memberid to return all book loans that have the memberid
            return fetch(`/api/loans?memberID=${encodeURIComponent(memberID)}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(loans => {

            // Uses the member id to return a merged table with bookname, checked out date, and return date
            return fetch(`/api/memberloans?memberID=${encodeURIComponent(memberID)}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No member data returned');
            }

            const loanContainer = document.getElementById('loanContainer');

            // For each book loan this creates a new line with data about the loan
            data.forEach(data => {
                console.log(data)
                if (data.return_date = null) {
                    let bookLoan = document.createElement('div')
                    loanContainer.appendChild(bookLoan);
                    bookLoan.className = "loanContainer"
                    checkedDate =  new Date(data.issue_date)
                    formatedCheckedDate = checkedDate.toLocaleString('en-US', options)
                    returnDate =  new Date(data.due_date)
                    formatedReturnDate = returnDate.toLocaleString('en-US', options)

                    let listItem1 = document.createElement('p');
                    listItem1.textContent = `${data.title}`

                    let listItem2 = document.createElement('p');
                    listItem2.textContent = `${formatedCheckedDate} `

                    let listItem3 = document.createElement('p');
                    listItem3.textContent = `${formatedReturnDate}`

                    bookLoan.appendChild(listItem1);
                    bookLoan.appendChild(listItem2);
                    bookLoan.appendChild(listItem3);
                }
            })
        })
        .catch(error => console.error('Error fetching member or loans:', error));
}
