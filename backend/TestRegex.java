import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class TestRegex {
    public static void main(String[] args) {
        try {
            // The fixed pattern using Unicode escapes
            Pattern p = Pattern.compile("^[\\s]*(\\d{3,6})\\s+([A-Za-z\\u00C0-\\u00FF'\\-\\s]+)", Pattern.MULTILINE);
            System.out.println("Pattern compiled successfully.");

            // Test case simulating a line that should match
            // Matches: Any whitespace, 3-6 digits, whitespace, Name (including accented
            // chars)
            String testInput = "   123456 João da Silva-Sá";
            Matcher m = p.matcher(testInput);
            if (m.find()) {
                System.out.println("Match found: " + m.group(0));
                System.out.println("Group 1 (Code): " + m.group(1));
                System.out.println("Group 2 (Name): " + m.group(2));
            } else {
                System.out.println("No match found for input: " + testInput);
            }

            // Test case 2
            String testInput2 = "123 Teste";
            Matcher m2 = p.matcher(testInput2);
            if (m2.find()) {
                System.out.println("Match found 2: " + m2.group(0));
            }

        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
