fetch('/api/books')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const catalog = document.getElementById('catalog');

        // For each book this creates new elements for book cover and information about on the book
        data.forEach(book => {
            let bookContainer = document.createElement('div')
            catalog.appendChild(bookContainer);
            bookContainer.className = "bookContainer"

            let bookCoverContainer = document.createElement('div')
            bookContainer.appendChild(bookCoverContainer);
            bookCoverContainer.className = "bookCoverContainer"

            let bookDetailContainer = document.createElement('div')
            bookContainer.appendChild(bookDetailContainer);
            bookDetailContainer.className = "bookDetailContainer"

            let listItem1 = document.createElement('p');
            listItem1.textContent = `Title: ${book.title}`

            let listItem2 = document.createElement('p');
            listItem2.textContent = `Author: ${book.author_name} `

            if (book.publisher != null) {
                let listItem3 = document.createElement('p');
                listItem3.textContent = `Publisher: ${book.publisher}`
                bookDetailContainer.appendChild(listItem3);
            }

            if (book.year != null) {
                let listItem4 = document.createElement('p');
                listItem4.textContent = `Year: ${book.year}`
                bookDetailContainer.appendChild(listItem4);
            }

            if (book.genre != null) {
                let listItem5 = document.createElement('p');
                listItem5.textContent = `Genre: ${book.genre}`
                bookDetailContainer.appendChild(listItem5);
            }

            let listItem6 = document.createElement('p');
            listItem6.textContent = `Copies Available: ${book.copies_available}`

            let bookCover = document.createElement('img');
            bookCover.src = book.cover

            bookCoverContainer.appendChild(bookCover);
            bookDetailContainer.appendChild(listItem1);
            bookDetailContainer.appendChild(listItem2);
            bookDetailContainer.appendChild(listItem6);

            
        })
    })
    .catch(error => console.error('Error fetching books:', error));