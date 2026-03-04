function adminPrivilges() {
    const navLinks = document.getElementById("navLinks")
    let adminListItem = document.createElement('li')
    let adminLink = document.createElement('a')

    adminLink.href = '../html/adminPanel.html'
    adminLink.textContent = 'Admin Panel'

    adminListItem.appendChild(adminLink)
    navLinks.appendChild(adminListItem)

}
