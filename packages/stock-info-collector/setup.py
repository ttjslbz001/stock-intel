from setuptools import setup, find_packages

setup(
    name="stock-info-collector",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "yfinance>=0.2.0",
        "requests>=2.28.0",
        "pandas>=1.5.0",
        "beautifulsoup4>=4.11.0",
        "boto3>=1.26.0",
    ],
) 