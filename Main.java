import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    private static final Scanner scanner = new Scanner(System.in);
    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/smart_clinic";

    public static void main(String[] args) throws SQLException {
        try (Connection connection = getConnection()) {
            run(connection);
        }
    }

    private static Connection getConnection() throws SQLException {
        String url = System.getenv().getOrDefault("MYSQL_URL", DEFAULT_URL);
        String user = requiredEnvironmentVariable("MYSQL_USER");
        String password = requiredEnvironmentVariable("MYSQL_PASSWORD");
        return DriverManager.getConnection(url, user, password);
    }

    private static String requiredEnvironmentVariable(String name) {
        String value = System.getenv(name);
        if (value == null || (name.equals("MYSQL_USER") && value.isBlank())) {
            throw new IllegalStateException(
                "Set the " + name + " environment variable before starting the application."
            );
        }
        return value;
    }

    private static void run(Connection connection) throws SQLException {
        System.out.println("=== Smart Clinic Appointment System ===");

        boolean running = true;
        while (running) {
            showMenu();
            int choice = readInt("Choose an option: ");

            switch (choice) {
                case 1 -> showDoctors(connection);
                case 2 -> bookAppointment(connection);
                case 3 -> listAppointments(connection);
                case 4 -> cancelAppointment(connection);
                case 5 -> {
                    running = false;
                    System.out.println("Thank you for using the clinic system.");
               }
               default -> System.out.println("Please choose an option from 1 to 5.");
           }
       }
   }

   private static void showMenu() {
       System.out.println("\n1. View doctors");
       System.out.println("2. Book an appointment");
       System.out.println("3. View appointments");
       System.out.println("4. Cancel an appointment");
       System.out.println("5. Exit");
   }

   private static void showDoctors(Connection connection) throws SQLException {
       showDoctors(getDoctors(connection));
   }

   private static void showDoctors(List<Doctor> doctors) {
       System.out.println("\nAvailable doctors:");
       if (doctors.isEmpty()) {
           System.out.println("No active doctors are available.");
           return;
       }
       for (int i = 0; i < doctors.size(); i++) {
           System.out.printf("%d. %s%n", i + 1, doctors.get(i).displayName());
       }
   }

   private static List<Doctor> getDoctors(Connection connection) throws SQLException {
       List<Doctor> doctors = new ArrayList<>();
       String sql = """
           SELECT doctor_id, name, specialty
           FROM doctors
           WHERE is_active = TRUE
           ORDER BY doctor_id
           """;
       try (Statement statement = connection.createStatement();
            ResultSet results = statement.executeQuery(sql)) {
           while (results.next()) {
               doctors.add(new Doctor(
                   results.getInt("doctor_id"),
                   results.getString("name"),
                   results.getString("specialty")
               ));
           }
       }
       return doctors;
   }

   private static void bookAppointment(Connection connection) throws SQLException {
       System.out.print("Patient name: ");
       String patientName = scanner.nextLine().trim();
       if (patientName.isEmpty()) {
           System.out.println("Patient name cannot be empty.");
           return;
       }
       if (patientName.length() > 80) {
           System.out.println("Patient name cannot be longer than 80 characters.");
           return;
       }

       List<Doctor> doctors = getDoctors(connection);
       if (doctors.isEmpty()) {
           System.out.println("No active doctors are available.");
           return;
       }
       showDoctors(doctors);
       int doctorChoice = readInt("Choose a doctor: ");
       if (doctorChoice < 1 || doctorChoice > doctors.size()) {
           System.out.println("Invalid doctor selection.");
           return;
       }

       LocalDate date;
       try {
           System.out.print("Appointment date (YYYY-MM-DD): ");
           date = LocalDate.parse(scanner.nextLine().trim());
           if (date.isBefore(LocalDate.now())) {
               System.out.println("Appointment date cannot be in the past.");
               return;
           }
       } catch (DateTimeParseException e) {
           System.out.println("Invalid date. Use YYYY-MM-DD.");
           return;
       }

       LocalTime time;
       try {
           System.out.print("Appointment time (HH:MM, 24-hour): ");
           time = LocalTime.parse(scanner.nextLine().trim());
       } catch (DateTimeParseException e) {
           System.out.println("Invalid time. Use HH:MM, for example 14:30.");
           return;
       }

       Doctor doctor = doctors.get(doctorChoice - 1);
       String slotQuery = """
           SELECT 1
           FROM appointments
           WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
           """;
       try (PreparedStatement statement = connection.prepareStatement(slotQuery)) {
           statement.setInt(1, doctor.id);
           statement.setDate(2, java.sql.Date.valueOf(date));
           statement.setTime(3, java.sql.Time.valueOf(time));
           try (ResultSet results = statement.executeQuery()) {
               if (results.next()) {
                   System.out.println("That doctor already has an appointment at this time.");
                   return;
               }
           }
       }

       String insertSql = """
           INSERT INTO appointments
               (patient_name, doctor_id, appointment_date, appointment_time)
           VALUES (?, ?, ?, ?)
           """;
       try (PreparedStatement statement = connection.prepareStatement(
               insertSql, Statement.RETURN_GENERATED_KEYS)) {
           statement.setString(1, patientName);
           statement.setInt(2, doctor.id);
           statement.setDate(3, java.sql.Date.valueOf(date));
           statement.setTime(4, java.sql.Time.valueOf(time));
           statement.executeUpdate();
           try (ResultSet keys = statement.getGeneratedKeys()) {
               if (!keys.next()) {
                   throw new SQLException("The database did not return an appointment ID.");
               }
               System.out.println(
                   "Appointment booked. Your appointment ID is " + keys.getLong(1) + "."
               );
           }
       } catch (SQLException e) {
           if (e.getErrorCode() == 1062) {
               System.out.println("That doctor already has an appointment at this time.");
               return;
           }
           throw e;
       }
   }

   private static void listAppointments(Connection connection) throws SQLException {
       List<Appointment> appointments = new ArrayList<>();
       String sql = """
           SELECT a.appointment_id, a.patient_name, d.name, d.specialty,
                  a.appointment_date, a.appointment_time
           FROM appointments AS a
           JOIN doctors AS d ON d.doctor_id = a.doctor_id
           ORDER BY a.appointment_date, a.appointment_time, a.appointment_id
           """;
       try (Statement statement = connection.createStatement();
            ResultSet results = statement.executeQuery(sql)) {
           while (results.next()) {
               appointments.add(new Appointment(
                   results.getLong("appointment_id"),
                   results.getString("patient_name"),
                   results.getString("name"),
                   results.getString("specialty"),
                   results.getDate("appointment_date").toLocalDate(),
                   results.getTime("appointment_time").toLocalTime()
               ));
           }
       }

       if (appointments.isEmpty()) {
           System.out.println("No appointments are currently booked.");
           return;
       }

       System.out.println("\nAppointments:");
       for (Appointment appointment : appointments) {
           System.out.println(appointment);
       }
   }

   private static void cancelAppointment(Connection connection) throws SQLException {
       long id = readLong("Enter the appointment ID to cancel: ");
       String sql = "DELETE FROM appointments WHERE appointment_id = ?";
       try (PreparedStatement statement = connection.prepareStatement(sql)) {
           statement.setLong(1, id);
           System.out.println(statement.executeUpdate() == 1
               ? "Appointment cancelled."
               : "No appointment found with that ID.");
       }
   }

   private static int readInt(String prompt) {
       System.out.print(prompt);
       try {
           return Integer.parseInt(scanner.nextLine().trim());
       } catch (NumberFormatException e) {
           return -1;
       }
   }

   private static long readLong(String prompt) {
       System.out.print(prompt);
       try {
           return Long.parseLong(scanner.nextLine().trim());
       } catch (NumberFormatException e) {
           return -1;
       }
   }

   private static class Doctor {
       private final int id;
       private final String name;
       private final String specialty;

       private Doctor(int id, String name, String specialty) {
           this.id = id;
           this.name = name;
           this.specialty = specialty;
       }

       private String displayName() {
           return "Dr. " + name + " - " + specialty;
       }
   }

   private static class Appointment {
       private final long id;
       private final String patientName;
       private final String doctorName;
       private final String specialty;
       private final LocalDate date;
       private final LocalTime time;

       private Appointment(long id, String patientName, String doctorName,
                           String specialty, LocalDate date, LocalTime time) {
           this.id = id;
           this.patientName = patientName;
           this.doctorName = doctorName;
           this.specialty = specialty;
           this.date = date;
           this.time = time;
       }

       @Override
       public String toString() {
           return "ID: " + id + " | Patient: " + patientName
               + " | Doctor: Dr. " + doctorName + " - " + specialty
               + " | Date: " + date
               + " | Time: " + time;
       }
   }
}
