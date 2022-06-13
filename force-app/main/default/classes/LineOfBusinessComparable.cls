public class LineOfBusinessComparable implements Comparable {
    public Product2 prod {get; private set;}
    private Integer order;
    
    private static Map<String, Integer> ordering = new Map<String, Integer> {
        'Hygiene' => 0,
        'Chemical' => 1,
        'Pest Control' => 2
    };

    public LineOfBusinessComparable(Product2 prod) {
        this.prod = prod;
        this.order = ordering.get(prod.Family);
        if (this.order == null) this.order = 99;
    }
    
    public Integer compareTo(Object compareTo) {
        LineOfBusinessComparable comparable = (LineOfBusinessComparable)compareTo;
        
        return this.order - comparable.order;
    }
}