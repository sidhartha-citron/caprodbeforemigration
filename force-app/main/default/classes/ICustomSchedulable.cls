public interface ICustomSchedulable extends Schedulable {
	void setBatchJobName(String name);
    void setCustomSettingsRecordName(String name);
}