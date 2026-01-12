// setup-couchdb.js
async function setupCouchDB() {
    const remoteDBUrl = 'http://admin:password@localhost:5984/textile-erp';
    
    try {
        // Create database
        const response = await fetch(remoteDBUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('Database created successfully');
            
            // Enable CORS
            await fetch('http://localhost:5984/_node/nonode@nohost/_config/httpd/enable_cors', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: '"true"'
            });
            
            await fetch('http://localhost:5984/_node/nonode@nohost/_config/cors/origins', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: '"*"'
            });
            
            await fetch('http://localhost:5984/_node/nonode@nohost/_config/cors/credentials', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: '"true"'
            });
            
            await fetch('http://localhost:5984/_node/nonode@nohost/_config/cors/methods', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: '"GET, PUT, POST, HEAD, DELETE"'
            });
            
            await fetch('http://localhost:5984/_node/nonode@nohost/_config/cors/headers', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: '"accept, authorization, content-type, origin"'
            });
            
            console.log('CORS enabled successfully');
            alert('CouchDB setup completed!');
        } else {
            console.error('Failed to create database');
            alert('Failed to setup CouchDB. Make sure CouchDB is running.');
        }
    } catch (error) {
        console.error('Setup error:', error);
        alert('Error setting up CouchDB: ' + error.message);
    }
}

// Run setup
setupCouchDB();
