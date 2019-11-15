class IEBError(Exception):
    """Base class for all industrial-energy-baseline exceptions."""
    pass

class DataQualityError(IEBError):
    """Raised when data quality requirements are not met."""
    pass

class ModelFitError(IEBError):
    """Raised when a baseline model fails to fit or does not meet criteria."""
    pass

class ExtrapolationWarning(UserWarning):
    """Warning raised when evaluating conditions outside the baseline domain."""
    pass

class ConfigurationError(IEBError):
    """Raised when there is an issue with the project configuration."""
    pass
