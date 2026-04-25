// Once the member login has been submited, this takes those values to the backend to be validated with the member table
document.getElementById('memberLoginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    let memberEmail = document.getElementById('mEmail').value; // Member email address
    let memberPassword = document.getElementById('mPass').value; // Member password

    try {
        const response = await fetch('/api/memberLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: memberEmail, password: memberPassword })
        });

        const result = await response.json();


        if (result.message == 'Invalid email or password') {
            alert('Invalid email or password!');
        }
        else {
            localStorage.setItem("member", result.message)
            localStorage.removeItem("staff");
            window.location.replace("/");
        }

    } catch (error) {
        console.error('Error:', error);
  }
});

// Once the staff login has been submited, this takes those values to the backend to be validated with the staff table
document.getElementById('staffLoginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    let staffEmail = document.getElementById('sEmail').value; // Staff email address
    let staffPassword = document.getElementById('sPass').value; // Staff password

    try {
        const response = await fetch('/api/staffLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: staffEmail, password: staffPassword })
        });

        const result = await response.json();


        if (result.message == 'Invalid email or password') {
            alert('Invalid email or password!');
        }
        else {
            localStorage.setItem("staff", result.message)
            localStorage.removeItem("member");
            window.location.replace("/");
        }

    } catch (error) {
        console.error('Error:', error);
  }
});