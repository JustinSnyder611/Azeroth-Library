let staffStorage = localStorage.getItem("staff")
let memberStorage = localStorage.getItem("member")

// Checks if there is any data in the staffStorage if there is then the staff is logged in
if (staffStorage != null) {
    document.getElementById("loggedInTab").href = "../html/adminPanel.html"
    document.getElementById("loggedInTab").text = "Staff Panel"
}

// Checks if there is any data in the memberStorage if there is then the member is logged in
if (memberStorage != null) {
    document.getElementById("loggedInTab").href = "../html/member.html"
    document.getElementById("loggedInTab").text = "Member Profile"
}

// Removes all values from the local storage which makes everyone be logged out
function resetPrivilges() {
    localStorage.clear()
    window.location.replace("/");
}
