# Smart Clinic Appointment System

## Create the MySQL database (Windows)

1. Open PowerShell in this project directory:

   ```powershell
   Set-Location "C:\Users\sriro\OneDrive\Desktop\SCAS"
   ```

2. Import the schema. If `mysql` is on PATH, run:

   ```powershell
   cmd /c "mysql -u root -p < database.sql"
   ```

   Otherwise, use the default MySQL Server 8.0 install path:

   ```powershell
   cmd /c """C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"" -u root -p < database.sql"
   ```

   Enter your MySQL root password when prompted. The script creates the
   `smart_clinic` database, its doctor and appointment tables, and three
   starter doctors. The appointment table prevents duplicate bookings for the
   same doctor, date, and time. You can also open `database.sql` in MySQL
   Workbench and execute the whole script there.

3. Verify that the database and starter doctors were created:

   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "USE smart_clinic; SHOW TABLES; SELECT name, specialty FROM doctors;"
   ```

4. Configure credentials in the same PowerShell window. Use the MySQL account
   and password you intend the application to connect with. The URL is
   optional when using the local default
   (`jdbc:mysql://localhost:3306/smart_clinic`):

   ```powershell
   $env:MYSQL_USER = "root"
   $env:MYSQL_PASSWORD = Read-Host "MySQL password"
   # Optional:
   $env:MYSQL_URL = "jdbc:mysql://localhost:3306/smart_clinic"
   ```

5. From this directory, build and start the console application:

   ```powershell
   mvn compile exec:java
   ```

Appointments are read from and written to MySQL, so they remain available
after the application exits. MySQL credentials are read from environment
variables and are not stored in the source code. The JDBC connection setup is
kept directly in `Main.java` so there is no separate database class file.
