## 类型双关

C++虽然是强类型语言，但可以很简单地绕过类型系统，**把同一段内存用不同类型进行解释**，这就叫类型双关；相比于类型转换，类型双关无需定义新的变量，只是对同一二进制数据的不同解释。

```c++
#include <iostream>

struct Entity {
    int x, y;
};

int main() {
    int a = 50;
    double value = *(double*)&a;
    std::cout << value << std::endl; // 5.18199e-297
    
    Entity e = { 5, 8 };
    std::cout << *(int*)((char*)&e + 4) << std::endl; // 8
    
    int* position = (int*)&e;
    std::cout << position[0] << ", " << position[1] << std::endl; // 5, 8
}
```

* 指针的类型决定了**解引用后变量的类型**以及**指针移动时的步长**
* `*(double*)&a`将整数`a`的二进制位以`double`类型进行解释，会包含4字节原数据以及4字节未定义数据
* `*(int*)((char*)&e + 4)`将指针移动到`y`的地址处，并以整数类型进行解释，相当于`e.y`
* `position[i]`实际上相当于`*(position + i)`，隐含的步长依据指针类型而定

## 联合体union

联合体与类、结构体较为相似，最突出的特点是联合体**一次只能占用一个成员的内存**，**不同成员共用同一内存**，根据各自类型对内存进行解释；比起类型双关，`union`的可读性通常更强。

```c++
#include <iostream>

struct Vector2 {
    float x, y;
};
struct Vector4 {
	union {
        struct {
            float x, y, z, w;
        };
        struct {
            Vector2 a, b;
        };
    };
};

void PrintVector2(const Vector2& vector) {
    std::cout << vector.x << ", " << vector.y << std::endl;
}

int main() {
    Vector4 vector = { 1.0f, 2.0f, 3.0f, 4.0f };
    PrintVector2(vector.a); // 1, 2
    PrintVector2(vector.b); // 3, 4
    vector.z = 50.0f;
    PrintVector2(vector.a); // 1, 2
    PrintVector2(vector.b); // 50, 4
}
```

* 通常`union`是**匿名使用**的，但匿名`union`不能含有成员函数
* 上述`union`中的两个`struct`是共享内存的成员，因此结构体`a`和变量`x, y`、结构体`b`和变量`z, w`分别共享内存
* 修改`vector.z`后，`vector.b`中的第一个数也进行了同样的改变；一个类型双关的实现同样功能的方法如下：

```c++
struct Vector4 {
    float x, y, z, w;
    Vector2& GetA() const {
        return *(Vector2*)&x;
    }
    Vector2& GetB() const {
        return *(Vector2*)&z;
    }
};
```

这样访问`Vector4.GetA()`的成员即为`Vector4.x`与`Vector4.y`，`GetB()`同理

## 虚析构函数

虚析构函数的存在是在告诉编译器，**当前父类在析构时可能需要调用派生子类的析构函数**

```c++
#include <iostream>

class Base {
public:
    Base() { std::cout << "Base Constructor\n"; }
    // 虚析构函数
    virtual ~Base() { std::cout << "Base Destructor\n"; }
};

class Derived : public Base {
public:
    Derived() { std::cout << "Derived Constructor\n"; }
    ~Derived() { std::cout << "Derived Destructor\n"; }
};

int main() {    
    Derived* derived = new Derived();
    delete derived;
    // Base Constructor
    // Derived Constructor
    // Derived Destructor
    // Base Destructor
    
    Base* poly = new Derived();
    delete poly;
    // 如果不使用虚析构函数：
    // Base Constructor
    // Derived Constructor
    // Base Destructor
}

```

* 一般情况下，实例化、释放子类对象时会额外调用父类的构造和析构函数，如上述对`derived`的操作
* 但如果将子类对象上行转换后再释放（如上述对`poly`的操作），则不会调用子类的析构函数，很可能导致子类中变量的内存泄漏问题
* 在会被扩展的父类中使用虚析构函数即可提醒编译器额外调用派生类的虚构函数（**自底向上**顺序）
        